"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Phone, PhoneCall, PhoneOff, AlertCircle, PhoneForwarded,
  Calendar, Search, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// shadcn/ui components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// --- MOCK DATA ---
const mockData = [
  { id: 1, address: "", boothNo: 162, name: "Liton Biswas", event: "", eventCount: null, problem: "", awareness: "", remarks: "Wrong Number" },
  { id: 2, address: "Netaji pally, Basudevpur", boothNo: 162, name: "Rampada Bhadury", event: "Yes", eventCount: 4, problem: "Waterlodge Problem", awareness: "Interested", remarks: "Responded" },
  { id: 3, address: "", boothNo: 162, name: "Khokan Roy", event: "", eventCount: null, problem: "", awareness: "", remarks: "Not responded" },
  { id: 4, address: "Netaji pally, Basudevpur", boothNo: 162, name: "Rabindranath Roy", event: "No", eventCount: 0, problem: "Waterlodge Problem", awareness: "Not Interested", remarks: "Responded" },
  { id: 5, address: "", boothNo: 162, name: "Pronab Biswas", event: "", eventCount: null, problem: "", awareness: "", remarks: "Not responding" },
  { id: 6, address: "Netaji pally, Basudevpur", boothNo: 162, name: "Judhisthir Biswas", event: "Yes", eventCount: 3, problem: "No problem", awareness: "Interested", remarks: "Responded" },
  { id: 7, address: "Netaji pally, Basudevpur", boothNo: 162, name: "Priya Biswas", event: "Yes", eventCount: 3, problem: "No problem", awareness: "Not Interested", remarks: "Responded" },
  { id: 8, address: "", boothNo: 162, name: "Suranjan Biswas", event: "", eventCount: null, problem: "", awareness: "", remarks: "Out of Service" },
  { id: 9, address: "", boothNo: 162, name: "Subhas Biswas", event: "", eventCount: null, problem: "", awareness: "", remarks: "Switch Off" },
  { id: 10, address: "Jagaddal", boothNo: 163, name: "Subrata Mondal", event: "Yes", eventCount: 4, problem: "Spreading Rumours", awareness: "Interested", remarks: "Responded" },
  { id: 11, address: "Rammohan Pally", boothNo: 163, name: "Nobin Debnath", event: "Yes", eventCount: 4, problem: "Poor Drainage system", awareness: "Interested", remarks: "Responded" },
  { id: 12, address: "", boothNo: 163, name: "Baburam Adhikary", event: "Yes", eventCount: 3, problem: "No problem", awareness: "Interested", remarks: "Responded" },
  { id: 13, address: "Jagaddal Harisava", boothNo: 163, name: "Sanjib Biswas", event: "Yes", eventCount: 4, problem: "Required more Banner", awareness: "Interested", remarks: "Responded" },
  { id: 14, address: "", boothNo: 165, name: "Ajay Bhattacharya", event: "", eventCount: null, problem: "", awareness: "", remarks: "Busy" },
  { id: 15, address: "", boothNo: 163, name: "Kartick Roy", event: "", eventCount: null, problem: "", awareness: "", remarks: "Out of Service" },
];

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#64748b'];
const ITEMS_PER_PAGE = 5;

export default function CampaignDashboard() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  // --- DERIVED METRICS ---
  const metrics = useMemo(() => {
    const total = mockData.length;
    const received = mockData.filter(d => d.remarks === "Responded").length;
    const busy = mockData.filter(d => d.remarks === "Busy").length;
    const invalid = mockData.filter(d => ["Wrong Number", "Out of Service", "Switch Off"].includes(d.remarks)).length;
    const complaints = mockData.filter(d => d.problem && d.problem !== "No problem").length;
    return { total, received, busy, invalid, complaints };
  }, []);

  // --- FILTERED & SEARCHED DATA ---
  const processedData = useMemo(() => {
    let data = mockData;

    // 1. Apply Bento Card Filter
    if (activeFilter === "received") data = data.filter(r => r.remarks === "Responded");
    else if (activeFilter === "busy") data = data.filter(r => r.remarks === "Busy");
    else if (activeFilter === "invalid") data = data.filter(r => ["Wrong Number", "Out of Service", "Switch Off"].includes(r.remarks));
    else if (activeFilter === "complaints") data = data.filter(r => r.problem && r.problem !== "No problem");

    // 2. Apply Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(r =>
        r.name.toLowerCase().includes(lowerQuery) ||
        (r.address && r.address.toLowerCase().includes(lowerQuery)) ||
        (r.problem && r.problem.toLowerCase().includes(lowerQuery)) ||
        r.boothNo.toString().includes(lowerQuery)
      );
    }

    return data;
  }, [activeFilter, searchQuery]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedData = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- CHART DATA PREPARATION ---
  const callStatusData = useMemo(() => {
    const statusCounts = mockData.reduce((acc: any, curr) => {
      const status = curr.remarks || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
  }, []);

  const complaintData = useMemo(() => {
    const compCounts = mockData.reduce((acc: any, curr) => {
      if (curr.problem && curr.problem !== "No problem") {
        acc[curr.problem] = (acc[curr.problem] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.keys(compCounts).map(key => ({ name: key, count: compCounts[key] }));
  }, []);

  // --- HELPER COMPONENTS ---
  const BentoCard = ({ title, count, icon: Icon, filterKey, colorClass }: any) => {
    const isActive = activeFilter === filterKey;
    return (
      <Card
        onClick={() => setActiveFilter(isActive ? "all" : filterKey)}
        className={`cursor-pointer transition-all duration-200 overflow-hidden ${isActive ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40 shadow-md' : 'hover:border-indigo-300 hover:shadow-md'
          }`}
      >
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1 text-foreground">{count}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={24} className="text-white" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "Responded") return "default"; // typically dark or primary color
    if (status === "Busy") return "outline";
    if (["Wrong Number", "Out of Service", "Switch Off"].includes(status)) return "destructive";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* HEADER & CONTROLS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campaign Operations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Real-time booth analytics and call center metrics.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center bg-slate-100/50 border rounded-lg px-3 py-1 text-sm">
              <Calendar size={16} className="text-slate-500 mr-2" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent outline-none text-slate-700" />
              <span className="mx-2 text-slate-400">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent outline-none text-slate-700" />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2">
              <Filter size={16} /> Apply Date Filter
            </Button>
          </div>
        </div>

        {/* BENTO CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <BentoCard title="Total Calls" count={metrics.total} icon={Phone} filterKey="all" colorClass="bg-gradient-to-br from-indigo-500 to-blue-600" />
          <BentoCard title="Received" count={metrics.received} icon={PhoneCall} filterKey="received" colorClass="bg-gradient-to-br from-emerald-400 to-green-600" />
          <BentoCard title="Busy Numbers" count={metrics.busy} icon={PhoneForwarded} filterKey="busy" colorClass="bg-gradient-to-br from-orange-400 to-amber-600" />
          <BentoCard title="Invalid/Wrong" count={metrics.invalid} icon={PhoneOff} filterKey="invalid" colorClass="bg-gradient-to-br from-rose-400 to-red-600" />
          <BentoCard title="Complaints" count={metrics.complaints} icon={AlertCircle} filterKey="complaints" colorClass="bg-gradient-to-br from-purple-500 to-fuchsia-600" />
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <h3 className="font-semibold text-lg text-slate-800">Overall Call Status</h3>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={callStatusData} innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value">
                    {callStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader>
              <h3 className="font-semibold text-lg text-slate-800">Frequent Booth Problems</h3>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} width={140} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* DATA TABLE SECTION WITH SEARCH & PAGINATION */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-slate-800">Call Log Directory</h3>
              {activeFilter !== 'all' && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  Filtered
                </Badge>
              )}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search name, booth, or problem..."
                className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              {/* GRADIENT TABLE HEADER */}
              <TableHeader className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-indigo-50 font-medium py-4">Booth No.</TableHead>
                  <TableHead className="text-indigo-50 font-medium py-4">Person Name</TableHead>
                  <TableHead className="text-indigo-50 font-medium py-4">Address</TableHead>
                  <TableHead className="text-indigo-50 font-medium py-4">Event (Times)</TableHead>
                  <TableHead className="text-indigo-50 font-medium py-4">Booth Problems</TableHead>
                  <TableHead className="text-indigo-50 font-medium py-4 text-right">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-slate-900">{row.boothNo}</TableCell>
                      <TableCell className="text-slate-700 font-medium">{row.name}</TableCell>
                      <TableCell className="text-slate-600">{row.address || <span className="text-slate-300">-</span>}</TableCell>
                      <TableCell className="text-slate-600">
                        {row.event ? (
                          <Badge variant="outline" className="font-normal bg-slate-50">
                            {row.event} ({row.eventCount})
                          </Badge>
                        ) : <span className="text-slate-300">-</span>}
                      </TableCell>
                      <TableCell>
                        {row.problem && row.problem !== "No problem" ? (
                          <span className="flex items-center text-rose-600 text-sm font-medium">
                            <AlertCircle size={14} className="mr-1.5 shrink-0" />
                            {row.problem}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-sm flex items-center">
                            No Issues
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getStatusBadgeVariant(row.remarks) as any} className={row.remarks === "Responded" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {row.remarks}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No records found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
              <p className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, processedData.length)}</span> of <span className="font-medium text-slate-900">{processedData.length}</span> results
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <div className="text-sm font-medium text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

