"use client";

import { useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SimulatedChartProps {
  type: "bar" | "pie";
  height?: number;
  color?: string;
}

export function SimulatedChart({
  type,
  height = 300,
  color = "#3b82f6",
}: SimulatedChartProps) {
  const [data, setData] = useState<any[]>([]);
  const requestRef = useRef<number | null>(null);

  // Generate initial random data
  useEffect(() => {
    if (type === "bar") {
      const initialData = Array.from({ length: 10 }).map((_, i) => ({
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 100) + 20,
      }));
      setData(initialData);
    } else {
      const initialData = [
        { name: "Group A", value: 400, color: "#0088FE" },
        { name: "Group B", value: 300, color: "#00C49F" },
        { name: "Group C", value: 300, color: "#FFBB28" },
        { name: "Group D", value: 200, color: "#FF8042" },
      ];
      setData(initialData);
    }
  }, [type]);

  // Animate/Shift data
  useEffect(() => {
    let lastUpdate = 0;
    
    const animate = (time: number) => {
      if (time - lastUpdate > 50) { // Update faster for smoothness (20fps)
        lastUpdate = time;
        setData(prevData => {
            if (type === "bar") {
                 return prevData.map(item => ({
                    ...item,
                    // Smaller delta for smoother "breathing" effect
                    value: Math.max(10, Math.min(120, item.value + (Math.random() - 0.5) * 5)) 
                 }));
            } else {
                 return prevData.map(item => ({
                    ...item,
                    // Smaller delta for pie chart too
                    value: Math.max(50, item.value + (Math.random() - 0.5) * 10)
                 }));
            }
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [type]);

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" hide />
            <YAxis hide domain={[0, 140]} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
