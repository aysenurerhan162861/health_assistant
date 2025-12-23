"use client";

import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import MealCommentModal from "../../../components/doctors/MealCommentModal";
import { Meal } from "../../../types/Meal";
import { User } from "../../../types/user";
import { getDoctorMeals } from "../../../services/MealApi";
import MealsTable from "../../../components/doctors/MealsTable";

const DoctorMealsPage: React.FC = () => {
  const [meals, setMeals] = useState<(Meal & { patient: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<(Meal & { patient: User }) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const data = await getDoctorMeals();
      console.log("Meals from backend:", data);
      setMeals(data as (Meal & { patient: User })[]);
    } catch (err) {
      console.error("Öğünler alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (meal: Meal & { patient: User }) => {
    setSelectedMeal(meal);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedMeal(null);
  };

  const handleUpdateMeal = (updatedMeal: Meal) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === updatedMeal.id ? { ...m, ...updatedMeal } : m))
    );
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 2, mt: 2 }}>
        <MealsTable meals={meals} onViewDetail={handleViewDetail} userRole="doctor" />

        <MealCommentModal
          open={modalOpen}
          onClose={handleModalClose}
          meal={selectedMeal}
          onUpdate={handleUpdateMeal}
        />
      </Box>
    </Layout>
  );
};

export default DoctorMealsPage;

