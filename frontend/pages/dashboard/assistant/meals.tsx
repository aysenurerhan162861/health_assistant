"use client";
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import MealsTable from "../../../components/doctors/MealsTable";
import MealCommentModal from "../../../components/doctors/MealCommentModal";
import { Meal } from "../../../types/Meal";
import { User } from "../../../types/user";
import axios from "axios";

const AssistantMealsPage: React.FC = () => {
  const [meals, setMeals] = useState<(Meal & { patient: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<(Meal & { patient: User }) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchMeals(); }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await axios.get("http://localhost:8000/api/assistants/me/meals", {
        headers: { "token-header": `Bearer ${token}` },
      });
      setMeals(res.data);
    } catch (err) {
      console.error("Öğünler alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}><CircularProgress /></Box></Layout>;

  return (
    <Layout>
      <Box sx={{ p: 2, mt: 2 }}>
        <MealsTable
          meals={meals}
          onViewDetail={(meal) => { setSelectedMeal(meal); setModalOpen(true); }}
          userRole="assistant"
        />
        <MealCommentModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedMeal(null); }}
          meal={selectedMeal}
          onUpdate={(updated) => setMeals(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))}
          userRole="assistant"
          allMeals={meals}
        />
      </Box>
    </Layout>
  );
};

export default AssistantMealsPage;