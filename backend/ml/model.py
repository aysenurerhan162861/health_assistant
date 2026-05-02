"""
backend/ml/model.py
ResUNet3D with Deep Supervision — V4 Patch-Based model
Attention U-Net'in yerine geçer
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class SEBlock3D(nn.Module):
    """Squeeze-and-Excitation: kanal bazlı attention."""
    def __init__(self, channels, reduction=4):
        super().__init__()
        mid = max(channels // reduction, 8)
        self.squeeze = nn.AdaptiveAvgPool3d(1)
        self.excitation = nn.Sequential(
            nn.Linear(channels, mid, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(mid, channels, bias=False),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c = x.shape[:2]
        w = self.squeeze(x).view(b, c)
        w = self.excitation(w).view(b, c, 1, 1, 1)
        return x * w


class ResBlock3D(nn.Module):
    """Residual Block: Conv → Norm → Act → Conv → Norm → + input → Act"""
    def __init__(self, in_ch, out_ch, dropout=0.0, use_se=True):
        super().__init__()
        self.conv1 = nn.Conv3d(in_ch, out_ch, 3, padding=1, bias=False)
        self.bn1 = nn.InstanceNorm3d(out_ch, affine=True)
        self.conv2 = nn.Conv3d(out_ch, out_ch, 3, padding=1, bias=False)
        self.bn2 = nn.InstanceNorm3d(out_ch, affine=True)
        self.act = nn.LeakyReLU(0.01, inplace=True)
        self.dropout = nn.Dropout3d(dropout) if dropout > 0 else nn.Identity()
        self.se = SEBlock3D(out_ch) if use_se else nn.Identity()
        self.shortcut = nn.Sequential(
            nn.Conv3d(in_ch, out_ch, 1, bias=False),
            nn.InstanceNorm3d(out_ch, affine=True)
        ) if in_ch != out_ch else nn.Identity()

    def forward(self, x):
        identity = self.shortcut(x)
        out = self.act(self.bn1(self.conv1(x)))
        out = self.dropout(out)
        out = self.bn2(self.conv2(out))
        out = self.se(out)
        out = out + identity
        out = self.act(out)
        return out


class ResUNet3D_DS(nn.Module):
    """
    ResUNet 3D with Deep Supervision.
    Inference'da sadece main output döner (deep supervision kapalı).
    """
    def __init__(self, in_ch=2, out_ch=1, filters=None, dropout=0.15):
        super().__init__()
        if filters is None:
            filters = [32, 64, 128, 256]
        f = filters
        bneck = f[-1] * 2

        # Encoder
        self.enc1 = ResBlock3D(in_ch, f[0], dropout=0)
        self.enc2 = ResBlock3D(f[0],  f[1], dropout=dropout)
        self.enc3 = ResBlock3D(f[1],  f[2], dropout=dropout)
        self.enc4 = ResBlock3D(f[2],  f[3], dropout=dropout)
        self.pool = nn.MaxPool3d(2)

        # Bottleneck
        self.bottleneck = ResBlock3D(f[3], bneck, dropout=dropout)

        # Decoder
        self.up4 = nn.ConvTranspose3d(bneck, f[3], 2, stride=2)
        self.dec4 = ResBlock3D(f[3]*2, f[3], dropout=dropout)

        self.up3 = nn.ConvTranspose3d(f[3], f[2], 2, stride=2)
        self.dec3 = ResBlock3D(f[2]*2, f[2], dropout=dropout)

        self.up2 = nn.ConvTranspose3d(f[2], f[1], 2, stride=2)
        self.dec2 = ResBlock3D(f[1]*2, f[1], dropout=0)

        self.up1 = nn.ConvTranspose3d(f[1], f[0], 2, stride=2)
        self.dec1 = ResBlock3D(f[0]*2, f[0], dropout=0)

        # Output
        self.out_conv = nn.Conv3d(f[0], out_ch, 1)

        # Deep Supervision (sadece training'de kullanılır)
        self.side4 = nn.Conv3d(f[3], out_ch, 1)
        self.side3 = nn.Conv3d(f[2], out_ch, 1)
        self.side2 = nn.Conv3d(f[1], out_ch, 1)

    def forward(self, x):
        input_size = x.shape[2:]

        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        b = self.bottleneck(self.pool(e4))

        u4 = self.up4(b)
        if u4.shape[2:] != e4.shape[2:]:
            u4 = F.interpolate(u4, size=e4.shape[2:], mode='trilinear', align_corners=False)
        d4 = self.dec4(torch.cat([u4, e4], dim=1))

        u3 = self.up3(d4)
        if u3.shape[2:] != e3.shape[2:]:
            u3 = F.interpolate(u3, size=e3.shape[2:], mode='trilinear', align_corners=False)
        d3 = self.dec3(torch.cat([u3, e3], dim=1))

        u2 = self.up2(d3)
        if u2.shape[2:] != e2.shape[2:]:
            u2 = F.interpolate(u2, size=e2.shape[2:], mode='trilinear', align_corners=False)
        d2 = self.dec2(torch.cat([u2, e2], dim=1))

        u1 = self.up1(d2)
        if u1.shape[2:] != e1.shape[2:]:
            u1 = F.interpolate(u1, size=e1.shape[2:], mode='trilinear', align_corners=False)
        d1 = self.dec1(torch.cat([u1, e1], dim=1))

        main_out = self.out_conv(d1)

        if self.training:
            s4 = F.interpolate(self.side4(d4), size=input_size, mode='trilinear', align_corners=False)
            s3 = F.interpolate(self.side3(d3), size=input_size, mode='trilinear', align_corners=False)
            s2 = F.interpolate(self.side2(d2), size=input_size, mode='trilinear', align_corners=False)
            return main_out, s2, s3, s4
        else:
            return main_out


# ── Geriye uyumluluk: eski isimle de import edilebilsin ──
AttentionUNet3D = ResUNet3D_DS