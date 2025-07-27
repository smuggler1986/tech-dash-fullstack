import React, { useState, useEffect } from "react";

const API = "https://tech-dash-api.onrender.com";

export default function App() {
  const [page, setPage] = useState("status");
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    wip: "",
    reg: "",
    work: "",
    
    overallStatus: "Pending",
    tasks: []
  });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(API + "/requests").then((res) => res.json()).then(setRequests);
  }, []);

  const totalLabour = (r, filter = null) => {
    if (!r.tasks?.length) {
      return filter && r.status !== "Authorised" ? 0 : parseFloat(r.overallLabour || 0);
    }
    return r.tasks.reduce((sum, t) => {
      if (filter && t.status !== filter) return sum;
      return sum + parseFloat(t.time || 0);
    }, 0);
  };

  const approvedHours = requests.reduce((sum, r) => sum + totalLabour(r, "Authorised"), 0);
  const requestedHours = requests.reduce((sum, r) => sum + totalLabour(r), 0);

  const deriveStatus = (tasks) => {
    const statuses = tasks.map((t) => t.status);
    const set = new Set(statuses);
    if (set.size === 1) return statuses[0];
    if (statuses.includes("Awaiting customer callback")) return "Awaiting customer callback";
    if (statuses.includes("Authorised")) return "Partially authorised";
    return "Pending";
  };

  const addTask = () => {
    setForm((f) => ({
      ...f,
      tasks: [...f.tasks, { desc: "", time: 0.1, parts: false, status: "Pending" }],
    }));
  };

  const removeTask = (i) => {
    setForm((f) => ({
      ...f,
      tasks: f.tasks.filter((_, index) => index !== i),
    }));
  };

  const updateTask = (i, field, value) => {
    const newTasks = [...form.tasks];
    newTasks[i][field] = field === "time" ? Math.max(0, parseFloat(value)) : value;
    setForm((f) => ({ ...f, tasks: newTasks }));
  };

  const submitForm = (e) => {
    e.preventDefault();
    const status = form.tasks.length ? deriveStatus(form.tasks) : form.overallStatus;
    fetch(API + "/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status }),
    })
      .then((res) => res.json())
      .then((data) => {
        setRequests([...requests, data]);
        setPage("status");
      });
  };

  const updateTaskStatus = (i, status) => {
    const updated = { ...selected };
    updated.tasks[i].status = status;
    setSelected(updated);
  };

  const saveUpdate = () => {
    const newStatus = deriveStatus(selected.tasks);
    fetch(API + "/requests/" + selected.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: selected.tasks, status: newStatus }),
    }).then(() => {
      setRequests((r) => r.map((x) => (x.id === selected.id ? { ...selected, status: newStatus } : x)));
      setPage("status");
    });
  };

  const approveAll = () => {
    setSelected((s) => ({
      ...s,
      tasks: s.tasks.map((t) => ({ ...t, status: "Authorised" })),
    }));
  };

  const declineAll = () => {
    setSelected((s) => ({
      ...s,
      tasks: s.tasks.map((t) => ({ ...t, status: "Declined" })),
    }));
  };

  const statusColor = (status) => {
    return {
      "Authorised": "bg-green-600",
      "Declined": "bg-red-500",
      "Pending": "bg-gray-500",
      "Partially authorised": "bg-yellow-500",
      "Awaiting customer callback": "bg-orange-400",
    }[status] || "bg-gray-400";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-6">
        {page !== "status" && (
          <button onClick={() => setPage("status")} className="text-blue-600 text-sm mb-4">← Back</button>
        )}

        {page === "status" && (
          <>
            <h1 className="text-3xl font-bold mb-2 text-center">Tech Dash</h1>
            <div className="flex justify-between text-sm text-gray-700 mb-3">
              <div><strong>Hours approved:</strong> {approvedHours.toFixed(1)} hrs</div>
              <div><strong>Hours requested:</strong> {requestedHours.toFixed(1)} hrs</div>
            </div>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr><th className="p-2">WIP</th><th>Reg</th><th>Work</th><th>Status</th><th>Approved</th><th>Requested</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => { setSelected(r); setPage("view"); }}>
                    <td className="p-2">{r.wip}</td>
                    <td>{r.reg}</td>
                    <td>{r.work}</td>
                    <td><span className={`text-white text-xs px-2 py-1 rounded-full ${statusColor(r.status)}`}>{r.status}</span></td>
                    <td>{totalLabour(r, "Authorised").toFixed(1)}</td>
                    <td>{totalLabour(r).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center mt-6">
              <button onClick={() => {
      setForm({ wip: "", reg: "", work: "", tasks: [] });
      setPage("form");
    }} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Add New Request
              </button>
            </div>
