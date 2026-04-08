"use client";

import React, { useState, useEffect } from "react";
import {
  Phone, PhoneCall, PhoneOff, AlertCircle, PhoneForwarded,
  Calendar, Search, ChevronLeft, ChevronRight, Filter, Loader2, LayoutDashboard, Database
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

// shadcn/ui components (Ensure these paths match your project)
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
const ITEMS_PER_PAGE = 20;

// IMPORTANT: Set this to your Express API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/campaign";

export default function CampaignDashboard() {
  // --- UI STATES ---
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // --- DATE STATES ---
  const [dateInput, setDateInput] = useState({ start: "", end: "" });
  const [appliedDates, setAppliedDates] = useState({ start: "", end: "" });

  // --- DATA STATES ---
  const [metrics, setMetrics] = useState({ total: 0, received: 0, busy: 0, invalid: 0, complaints: 0 });
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [callStatusData, setCallStatusData] = useState([]);
  const [complaintData, setComplaintData] = useState([]);

  // 1. Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // 2. Fetch Dashboard Metrics & Charts
  useEffect(() => {
    const fetchMetricsAndCharts = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: appliedDates.start,
          endDate: appliedDates.end
        });

        const [metricsRes, statusRes, problemsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/metrics?${queryParams}`),
          fetch(`${API_BASE_URL}/charts/status?${queryParams}`),
          fetch(`${API_BASE_URL}/charts/problems?${queryParams}`) // Ensure your MySQL limit is removed/increased to 100 for this API
        ]);

        const [metricsJson, statusJson, problemsJson] = await Promise.all([
          metricsRes.json(), statusRes.json(), problemsRes.json()
        ]);

        if (metricsJson.success) setMetrics(metricsJson.data);
        if (statusJson.success) setCallStatusData(statusJson.data);
        if (problemsJson.success) setComplaintData(problemsJson.data);

      } catch (error) {
        console.error("Error fetching dashboard aggregated data:", error);
      }
    };

    fetchMetricsAndCharts();
  }, [appliedDates]);

  // 3. Fetch Table Logs
  useEffect(() => {
    const fetchTableData = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          filter: activeFilter,
          search: debouncedSearch,
          startDate: appliedDates.start,
          endDate: appliedDates.end
        });

        const res = await fetch(`${API_BASE_URL}/logs?${queryParams}`);
        const json = await res.json();

        if (json.success) {
          setTableData(json.data.records);
          setTotalRecords(json.data.pagination.totalRecords);
        }
      } catch (error) {
        console.error("Error fetching table logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableData();
  }, [currentPage, activeFilter, debouncedSearch, appliedDates]);

  const handleApplyDates = () => {
    setAppliedDates(dateInput);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  // Math calculation for the custom bar chart
  const maxComplaintCount = complaintData.length > 0
    ? Math.max(...complaintData.map(d => d.count))
    : 1;

  // Custom Bento Card Component
  const BentoCard = ({ title, count, icon: Icon, filterKey, colorFrom, colorTo, shadowColor }: any) => {
    const isActive = activeFilter === filterKey;
    return (
      <Card
        onClick={() => setActiveFilter(isActive ? "all" : filterKey)}
        className={`cursor-pointer group relative overflow-hidden transition-all duration-300 ease-out border
          ${isActive
            ? `ring-2 ring-offset-2 border-transparent bg-white shadow-lg ${shadowColor}`
            : 'bg-white hover:shadow-xl hover:-translate-y-1 border-slate-200/60 shadow-sm hover:border-indigo-200'
          }`}
        style={isActive ? { borderColor: colorFrom } : {}}
      >
        {isActive && (
          <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${colorFrom} ${colorTo}`} />
        )}
        <CardContent className="p-5 md:p-6 flex justify-between items-center relative z-10">
          <div>
            <p className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{title}</p>
            <h3 className="text-3xl font-extrabold tracking-tight mt-1 text-slate-900">{count.toLocaleString()}</h3>
          </div>
          <div className={`p-3 md:p-4 rounded-2xl shadow-inner bg-gradient-to-br ${colorFrom} ${colorTo}`}>
            <Icon size={24} className="text-white drop-shadow-sm" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStatusBadge = (status: string) => {
    if (status === "Responded" || status === "Good") {
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 shadow-none font-medium">Responded</Badge>;
    }
    if (status === "Busy" || status === "Person is busy") {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 shadow-none font-medium">Busy</Badge>;
    }
    if (["Wrong Number", "Out of Service", "Switch Off", "Number is Wrong"].includes(status)) {
      return <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 shadow-none font-medium">{status}</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 shadow-none font-medium">{status || "Unknown"}</Badge>;
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-8">

        {/* --- HEADER & CONTROLS --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <LayoutDashboard className="text-indigo-600 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Campaign Analytics</h1>
              <p className="text-slate-500 mt-1 text-sm font-medium">Real-time booth overview and caller metrics.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 flex-1 sm:flex-none focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Calendar size={18} className="text-indigo-500 mr-3 shrink-0" />
              <input
                type="date"
                value={dateInput.start}
                onChange={(e) => setDateInput({ ...dateInput, start: e.target.value })}
                className="bg-transparent outline-none text-slate-700 text-sm font-medium w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <span className="mx-3 text-slate-300">|</span>
              <input
                type="date"
                value={dateInput.end}
                onChange={(e) => setDateInput({ ...dateInput, end: e.target.value })}
                className="bg-transparent outline-none text-slate-700 text-sm font-medium w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <Button onClick={handleApplyDates} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 py-6 sm:py-4 px-6 transition-all active:scale-95">
              <Filter size={18} className="mr-2" /> Apply Range
            </Button>
          </div>
        </div>

        {/* --- BENTO CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          <BentoCard title="Total Calls" count={metrics.total} icon={Phone} filterKey="all" colorFrom="from-indigo-500" colorTo="to-blue-600" shadowColor="shadow-indigo-500/20" />
          <BentoCard title="Received" count={metrics.received} icon={PhoneCall} filterKey="received" colorFrom="from-emerald-400" colorTo="to-emerald-600" shadowColor="shadow-emerald-500/20" />
          <BentoCard title="Busy Numbers" count={metrics.busy} icon={PhoneForwarded} filterKey="busy" colorFrom="from-amber-400" colorTo="to-orange-500" shadowColor="shadow-amber-500/20" />
          <BentoCard title="Invalid/Wrong" count={metrics.invalid} icon={PhoneOff} filterKey="invalid" colorFrom="from-rose-400" colorTo="to-red-600" shadowColor="shadow-rose-500/20" />
          <BentoCard title="Complaints" count={metrics.complaints} icon={AlertCircle} filterKey="complaints" colorFrom="from-violet-500" colorTo="to-purple-600" shadowColor="shadow-violet-500/20" />
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Status Pie Chart */}
          <Card className="shadow-sm border-slate-200/60 rounded-3xl bg-white overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" /> Call Resolutions
              </h3>
            </CardHeader>
            <CardContent className="flex-1 p-4 min-h-[380px] flex items-center justify-center">
              {callStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={callStatusData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                      {callStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Database className="w-10 h-10 mb-2 opacity-20" />
                  <span>No data available</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CUSTOM SCROLLABLE LIST CHART (Handles 100+ Items perfectly) */}
          <Card className="lg:col-span-2 shadow-sm border-slate-200/60 rounded-3xl bg-white flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" /> Frequent Booth Problems
              </h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold shadow-none">
                {complaintData.length} Total Issues
              </Badge>
            </CardHeader>

            <CardContent className="flex-1 p-0">
              {complaintData.length > 0 ? (
                // This container handles scrolling beautifully
                <div className="h-[380px] overflow-y-auto px-6 py-4 space-y-5
                  [&::-webkit-scrollbar]:w-2 
                  [&::-webkit-scrollbar-track]:bg-slate-50 
                  [&::-webkit-scrollbar-thumb]:bg-slate-200 
                  [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">

                  {complaintData.map((item: any, index) => {
                    const percentage = Math.max((item?.count / maxComplaintCount) * 100, 2); // min 2% width so it's visible

                    return (
                      <div key={index} className="group relative">
                        <div className="flex justify-between items-end mb-1.5 gap-4">
                          {/* Truncated Text with hover tooltip effect */}
                          <span className="text-sm font-semibold text-slate-700 truncate block flex-1" title={item?.name}>
                            {index + 1}. {item?.name}
                          </span>
                          <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item?.count}
                          </span>
                        </div>
                        {/* Custom Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-[380px] flex flex-col items-center justify-center text-slate-400">
                  <Database className="w-10 h-10 mb-2 opacity-20" />
                  <span>No problems recorded</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- DATA TABLE SECTION --- */}
        <Card className="shadow-sm border-slate-200/60 rounded-3xl bg-white overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-800">Call Log Directory</h3>
              {activeFilter !== 'all' && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1 font-semibold">
                  Filtered: {activeFilter}
                </Badge>
              )}
            </div>
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <Input
                placeholder="Search name, booth, or problem..."
                className="pl-11 bg-white border-slate-200/80 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500/20 py-5 w-full shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto relative min-h-[300px]">
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="font-semibold text-slate-700">Fetching records...</span>
                </div>
              </div>
            )}
            <Table className="w-full">
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-600 font-bold py-5 whitespace-nowrap">Booth No.</TableHead>
                  <TableHead className="text-slate-600 font-bold py-5 whitespace-nowrap">Person Name</TableHead>
                  <TableHead className="text-slate-600 font-bold py-5 whitespace-nowrap">Address</TableHead>
                  <TableHead className="text-slate-600 font-bold py-5 whitespace-nowrap text-center">Event (Times)</TableHead>
                  <TableHead className="text-slate-600 font-bold py-5 whitespace-nowrap">Booth Problems</TableHead>
                  <TableHead className="text-slate-600 font-bold py-5 text-right whitespace-nowrap">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length > 0 ? (
                  tableData.map((row: any) => (
                    <TableRow key={row?.id} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-100/50">
                      <TableCell className="font-bold text-slate-800">{row?.boothNo}</TableCell>
                      <TableCell className="font-semibold text-slate-700 whitespace-nowrap">{row?.name}</TableCell>
                      <TableCell className="text-slate-500 max-w-[200px] truncate" title={row?.address}>
                        {row?.address || <span className="text-slate-300 italic">Not provided</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {row?.event && row?.event !== "NULL" ? (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium">
                            {row?.event} <span className="ml-1 text-indigo-500 font-bold">({row?.eventCount})</span>
                          </Badge>
                        ) : <span className="text-slate-300">-</span>}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        {row?.problem && row?.problem !== "No problem" && row?.problem !== "No" ? (
                          <span className="flex items-start text-rose-600 text-sm font-semibold truncate" title={row?.problem}>
                            <AlertCircle size={16} className="mr-2 shrink-0 mt-0.5 text-rose-500" />
                            <span className="truncate">{row?.problem}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-sm flex items-center font-medium bg-emerald-50 w-fit px-2 py-1 rounded-md">
                            No Issues
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderStatusBadge(row?.remarks)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      {!isLoading && (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Database className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-lg font-medium text-slate-500">No records found</p>
                          <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* --- PAGINATION CONTROLS --- */}
          {totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-slate-100 bg-slate-50/50 gap-4">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)}</span> of <span className="font-bold text-indigo-600">{totalRecords}</span> results
              </p>
              <div className="flex items-center space-x-2 bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  <ChevronLeft size={18} />
                </Button>
                <div className="text-sm font-bold text-slate-700 px-4">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || isLoading}
                  className="rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}