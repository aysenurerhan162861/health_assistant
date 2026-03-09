import torch
import torch.nn as nn
import torch.nn.functional as F


class ConvBlock3D(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv3d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.InstanceNorm3d(out_ch, affine=True),
            nn.ReLU(inplace=True),
            nn.Conv3d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.InstanceNorm3d(out_ch, affine=True),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class AttentionGate3D(nn.Module):
    def __init__(self, g_ch, x_ch, int_ch):
        super().__init__()
        self.W_g = nn.Sequential(
            nn.Conv3d(g_ch, int_ch, 1, bias=False),
            nn.InstanceNorm3d(int_ch, affine=True)
        )
        self.W_x = nn.Sequential(
            nn.Conv3d(x_ch, int_ch, 1, bias=False),
            nn.InstanceNorm3d(int_ch, affine=True)
        )
        self.psi = nn.Sequential(
            nn.Conv3d(int_ch, 1, 1, bias=False),
            nn.InstanceNorm3d(1, affine=True),
            nn.Sigmoid()
        )

    def forward(self, g, x):
        if g.shape[2:] != x.shape[2:]:
            g = F.interpolate(g, size=x.shape[2:], mode='trilinear', align_corners=True)
        alpha = self.psi(F.relu(self.W_g(g) + self.W_x(x), inplace=True))
        return x * alpha


class AttentionUNet3D(nn.Module):
    def __init__(self, in_ch=1, out_ch=1, base=16):
        super().__init__()
        self.enc1 = ConvBlock3D(in_ch,  base)
        self.enc2 = ConvBlock3D(base,   base*2)
        self.enc3 = ConvBlock3D(base*2, base*4)
        self.enc4 = ConvBlock3D(base*4, base*8)
        self.pool = nn.MaxPool3d(2)

        self.bottleneck = ConvBlock3D(base*8, base*16)

        self.up4 = nn.ConvTranspose3d(base*16, base*8, 2, stride=2)
        self.up3 = nn.ConvTranspose3d(base*8,  base*4, 2, stride=2)
        self.up2 = nn.ConvTranspose3d(base*4,  base*2, 2, stride=2)
        self.up1 = nn.ConvTranspose3d(base*2,  base,   2, stride=2)

        self.att4 = AttentionGate3D(base*8, base*8, base*4)
        self.att3 = AttentionGate3D(base*4, base*4, base*2)
        self.att2 = AttentionGate3D(base*2, base*2, base)
        self.att1 = AttentionGate3D(base,   base,   base//2)

        self.dec4 = ConvBlock3D(base*16, base*8)
        self.dec3 = ConvBlock3D(base*8,  base*4)
        self.dec2 = ConvBlock3D(base*4,  base*2)
        self.dec1 = ConvBlock3D(base*2,  base)

        self.out = nn.Conv3d(base, out_ch, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        b  = self.bottleneck(self.pool(e4))

        d4 = self.up4(b)
        d4 = self.dec4(torch.cat([d4, self.att4(d4, e4)], dim=1))

        d3 = self.up3(d4)
        d3 = self.dec3(torch.cat([d3, self.att3(d3, e3)], dim=1))

        d2 = self.up2(d3)
        d2 = self.dec2(torch.cat([d2, self.att2(d2, e2)], dim=1))

        d1 = self.up1(d2)
        d1 = self.dec1(torch.cat([d1, self.att1(d1, e1)], dim=1))

        return self.out(d1)