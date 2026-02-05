"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Database,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface TableInfo {
  id: string;
  table_name: string;
  display_name: string;
  columns: { name: string; type: string }[];
}

interface CalendarEvent {
  id: string;
  date: string;
  data: Record<string, any>;
}

export default function EnhancedCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedDateField, setSelectedDateField] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch available tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch events when table and field are selected
  useEffect(() => {
    if (selectedTable && selectedDateField) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [selectedTable, selectedDateField, currentDate]);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/notice?action=tables");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTables(data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load tables");
    }
  };

  const fetchEvents = async () => {
    if (!selectedTable || !selectedDateField) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/notice?action=get-data&tableName=${selectedTable}`,
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        // Filter and format events based on selected date field
        const calendarEvents: CalendarEvent[] = data
          .filter((row) => row[selectedDateField]) // Only include rows with date values
          .map((row, index) => ({
            id: row.id || `event-${index}`,
            date: formatDateForCalendar(row[selectedDateField]),
            data: row,
          }))
          .filter((event) => event.date); // Remove invalid dates

        setEvents(calendarEvents);
      } else {
        toast.error(`Failed to load data: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForCalendar = (dateValue: any): string => {
    if (!dateValue) return "";

    try {
      let date: Date;

      // Handle different date formats
      if (typeof dateValue === "string") {
        // Try parsing as ISO string first
        date = new Date(dateValue);

        // If that fails, try other common formats
        if (isNaN(date.getTime())) {
          // Try parsing as YYYY-MM-DD
          const parts = dateValue.split("-");
          if (parts.length === 3) {
            date = new Date(
              parseInt(parts[0]),
              parseInt(parts[1]) - 1,
              parseInt(parts[2]),
            );
          } else {
            return "";
          }
        }
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === "number") {
        date = new Date(dateValue);
      } else {
        return "";
      }

      if (isNaN(date.getTime())) {
        return "";
      }

      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const getSelectedTableInfo = (): TableInfo | undefined => {
    return tables.find((t) => t.table_name === selectedTable);
  };

  const getDateFields = (): { name: string; type: string }[] => {
    const tableInfo = getSelectedTableInfo();
    if (!tableInfo) return [];
    return tableInfo.columns.filter((col) => col.type === "date");
  };

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const previousMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );

  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );

  const getEventsForDate = (day: number): CalendarEvent[] => {
    // For birthday-type data, we want to match month and day regardless of year
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = day;

    return events.filter((event) => {
      if (!event.date) return false;

      // Parse the event date
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth() + 1;
      const eventDay = eventDate.getDate();

      // Match month and day, ignore year (useful for birthdays, anniversaries, etc.)
      return eventMonth === currentMonth && eventDay === currentDay;
    });
  };

  // Get months that have events
  const getMonthsWithEvents = (): {
    month: number;
    year: number;
    count: number;
  }[] => {
    const monthCounts = new Map<string, number>();

    events.forEach((event) => {
      if (!event.date) return;
      const eventDate = new Date(event.date);
      const monthKey = `${eventDate.getMonth()}-${eventDate.getFullYear()}`;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    return Array.from(monthCounts.entries())
      .map(([key, count]) => {
        const [month, year] = key.split("-").map(Number);
        return { month, year, count };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  };

  const navigateToMonth = (month: number, year: number) => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDateClick = (day: number) => {
    const dateObj = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    setSelectedDate(dateObj);
    const dayEvents = getEventsForDate(day);
    setSelectedEvents(dayEvents);
    if (dayEvents.length > 0) {
      setIsModalOpen(true);
    }
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const renderEventData = (data: Record<string, any>) => {
    const tableInfo = getSelectedTableInfo();
    if (!tableInfo) return null;

    return (
      <div className="space-y-3">
        {tableInfo.columns.map((col) => {
          const value = data[col.name];
          if (value === null || value === undefined || value === "")
            return null;

          return (
            <div key={col.name} className="flex flex-col space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {col.name.replace(/_/g, " ")}
              </Label>
              <div className="text-sm font-medium">
                {col.type === "date"
                  ? new Date(value).toLocaleDateString()
                  : String(value)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Calendar Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Select Table
            </Label>
            <Select
              value={selectedTable}
              onValueChange={(value) => {
                setSelectedTable(value);
                setSelectedDateField(""); // Reset date field when table changes
              }}
            >
              <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Choose a table..." />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.table_name} value={table.table_name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{table.display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {table.table_name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tables.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No tables found. Create tables in the Notice Builder first.
              </p>
            )}
          </div>

          {/* Date Field Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Date Field
            </Label>
            <Select
              value={selectedDateField}
              onValueChange={setSelectedDateField}
              disabled={!selectedTable}
            >
              <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Choose a date field..." />
              </SelectTrigger>
              <SelectContent>
                {getDateFields().map((field) => (
                  <SelectItem key={field.name} value={field.name}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        DATE
                      </Badge>
                      <span>{field.name.replace(/_/g, " ")}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTable && getDateFields().length === 0 && (
              <p className="text-sm text-amber-600">
                No date fields found in selected table.
              </p>
            )}
          </div>
        </div>

        {selectedTable && selectedDateField && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Active:</span> Showing events from{" "}
              <span className="font-mono bg-green-100 px-1 rounded">
                {selectedTable}
              </span>{" "}
              using date field{" "}
              <span className="font-mono bg-green-100 px-1 rounded">
                {selectedDateField}
              </span>
            </p>
          </div>
        )}
      </Card>

      {/* Quick Navigation to Months with Events */}
      {selectedTable && selectedDateField && events.length > 0 && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {getMonthsWithEvents().map(({ month, year, count }) => {
              const monthName = new Date(year, month, 1).toLocaleDateString(
                "en-US",
                { month: "short" },
              );
              const isCurrentMonth =
                currentDate.getMonth() === month &&
                currentDate.getFullYear() === year;

              return (
                <button
                  key={`${month}-${year}`}
                  onClick={() => navigateToMonth(month, year)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    isCurrentMonth
                      ? "bg-blue-500 text-white"
                      : "bg-white text-blue-700 hover:bg-blue-100 border border-blue-300"
                  }`}
                >
                  {monthName} {year} ({count})
                </button>
              );
            })}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Click to jump to months with events. Numbers show event count.
          </p>
        </Card>
      )}

      {/* Calendar */}
      <Card className="p-6 bg-white border-0 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            {monthName}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="hover:bg-blue-50"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="hover:bg-blue-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="hover:bg-blue-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading calendar data...
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center font-semibold text-blue-600 bg-blue-50 rounded-lg"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDate(day) : [];
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={index}
                onClick={() => day && handleDateClick(day)}
                className={`p-3 min-h-24 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  day
                    ? hasEvents
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300"
                    : "bg-gray-50 cursor-default"
                }`}
              >
                {day && (
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">{day}</p>
                    {dayEvents.slice(0, 2).map((event, i) => (
                      <div
                        key={i}
                        className="text-xs mt-1 p-1 bg-blue-500 text-white rounded truncate shadow-sm"
                      >
                        {Object.values(event.data)[1] || `Event ${i + 1}`}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs mt-1 p-1 bg-gray-500 text-white rounded text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!selectedTable && (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-50 rounded-lg inline-block">
              <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                Select a table and date field to view calendar events
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Event Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {selectedEvents.length} event
                {selectedEvents.length !== 1 ? "s" : ""}
              </Badge>
              <span>from</span>
              <Badge variant="secondary">
                {getSelectedTableInfo()?.display_name}
              </Badge>
            </div>

            {selectedEvents.map((event, index) => (
              <Card key={event.id} className="p-4 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Event {index + 1}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    ID: {event.id}
                  </Badge>
                </div>
                {renderEventData(event.data)}
              </Card>
            ))}

            {selectedEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No events found for this date.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
