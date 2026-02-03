"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView({ company }: { company: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        const { data: companies } = await supabase
          .from("companies")
          .select("*")
          .eq("code", company.toUpperCase());
        if (!companies?.length) return;

        const companyId = companies[0].id;

        const { data: calendarEvents } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("company_id", companyId);
        const { data: branchData } = await supabase
          .from("branches")
          .select("*")
          .eq("company_id", companyId);

        setEvents(calendarEvents || []);
        setBranches(branchData || []);
      } catch (error) {
        console.error("Error loading calendar data:", error);
      }
    };

    loadCalendarData();
  }, [company]);

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const previousMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const getEventsForDate = (day: number) => {
    const dateStr = formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    return events.filter((e) => e.event_date === dateStr);
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays = Array.from({ length: firstDay })
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const handleDateClick = (day: number) => {
    const dateObj = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(dateObj);
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setIsOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white border-0 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center font-semibold text-blue-600 bg-blue-50 rounded"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => day && handleDateClick(day)}
              className={`p-3 min-h-24 rounded border-2 cursor-pointer transition ${
                day
                  ? getEventsForDate(day).length > 0
                    ? "border-blue-500 bg-blue-50 hover:bg-blue-100"
                    : "border-gray-200 bg-white hover:bg-blue-50"
                  : "bg-gray-50"
              }`}
            >
              {day && (
                <div>
                  <p className="font-semibold text-gray-800">{day}</p>
                  {getEventsForDate(day).map((event, i) => (
                    <div
                      key={i}
                      className="text-xs mt-1 p-1 bg-blue-200 text-blue-900 rounded truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Branch Details Summary */}
      <Card className="p-6 bg-white border-0 shadow-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">
          Branch Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
            >
              <h3 className="font-semibold text-blue-900 mb-2">
                {branch.name}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">Location: {branch.location}</p>
                <p className="text-gray-700">
                  Manpower: {branch.actual_manpower}/{branch.approved_manpower}
                </p>
                <p className="text-gray-700">
                  Total Salary: ₹{branch.total_salary?.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Event Details Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-blue-900">
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Date</p>
              <p className="font-semibold">{selectedDate?.toDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p>{selectedEvent?.description || "No description provided"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Type</p>
              <p className="font-semibold">{selectedEvent?.event_type}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
