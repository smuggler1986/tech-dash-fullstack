import React, { useState, useEffect } from "react";

const backendURL = "https://tech-dash-api.onrender.com";

export default function App() {
  const [page, setPage] = useState("status");
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    wip: "",
    reg: "",
    work: "",
    tasks: [
      { desc: "Replace brake pads", time: 0.5, parts: true },
      { desc: "Clean calipers", time: 0.3, parts: false },
      { desc: "Test drive", time: 0.2, parts: true },
    ],
  });

  useEffect(() => {
    fetch(`${backendURL}/requests`)
      .then(res => res.json())
      .then(data => setRequests(data));
  }, []);

  const statusColor = {
    Approved: "bg-green-500",
    Pending: "bg-yellow-400",
    Declined: "bg-red-500",
  };

  const handleTaskChange = (index, key, value) => {
    const updatedTasks = form.tasks.map((t, i) =>
      i === index ? { ...t, [key]: value } : t
    );
    setForm({ ...form, tasks: updatedTasks });
  };

  const addTask = () => {
    setForm({ ...form, tasks: [...form.tasks, { desc: "", time: 0.0, parts: false }] });
  };

  const removeTask = (index) => {
    setForm({ ...form, tasks: form.tasks.filter((_, i) => i !== index) });
  };

  const updateTime = (index, delta) => {
    const task = form.tasks[index];
    const newTime = Math.max(0, parseFloat(task.time) + delta).toFixed(1);
    handleTaskChange(index, "time", parseFloat(newTime));
  };

  const submitRequest = (e) => {
    e.preventDefault();
    fetch(`${backendURL}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wip: form.wip,
        reg: form.reg,
        work: form.work,
        status: "Pending",
      }),
    })
    .then(res => res.json())
    .then(data => {
      setRequests([...requests, data]);
      setPage("status");
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6">
        {page !== "status" && (
          <button className="text-sm text-blue-600 hover:underline mb-4" onClick={() => setPage("status")}>← Back</button>
        )}

        {page === "status" && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800">Tech Dash</h1>
            <table className="w-full mt-6 border text-sm">
              <thead className="bg-gray-200">
                <tr><th>WIP</th><th>Reg</th><th>Work</th><th>Status</th></tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{r.wip}</td>
                    <td className="p-2">{r.reg}</td>
                    <td className="p-2">{r.work}</td>
                    <td className="p-2">
                      <span className={`text-white px-3 py-1 rounded-full ${statusColor[r.status] || "bg-gray-400"}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center mt-6">
              <button onClick={() => setPage("form")} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow">Add New Request</button>
            </div>
          </>
        )}

        {page === "form" && (
          <form onSubmit={submitRequest}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input required placeholder="WIP Number" value={form.wip} onChange={e => setForm({ ...form, wip: e.target.value })} className="border px-3 py-2 rounded" />
              <input required placeholder="Registration" value={form.reg} onChange={e => setForm({ ...form, reg: e.target.value })} className="border px-3 py-2 rounded" />
            </div>
            <textarea required placeholder="Work Description" value={form.work} onChange={e => setForm({ ...form, work: e.target.value })} className="w-full border px-3 py-2 rounded mb-4" rows={2} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Labour Breakdown</h3>
            <table className="w-full border mb-4 text-sm">
              <thead><tr className="bg-gray-100"><th>Description</th><th>Time</th><th>Parts</th><th></th></tr></thead>
              <tbody>
                {form.tasks.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2"><input value={t.desc} onChange={e => handleTaskChange(i, "desc", e.target.value)} className="w-full border px-2 py-1 rounded" /></td>
                    <td className="p-2 flex gap-1 items-center">
                      <button type="button" onClick={() => updateTime(i, -0.1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                      <input value={t.time} onChange={e => handleTaskChange(i, "time", parseFloat(e.target.value))} className="w-12 border rounded text-center" />
                      <button type="button" onClick={() => updateTime(i, 0.1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                    </td>
                    <td className="p-2 text-center"><input type="checkbox" checked={t.parts} onChange={e => handleTaskChange(i, "parts", e.target.checked)} /></td>
                    <td className="p-2 text-center"><button type="button" onClick={() => removeTask(i)} className="text-red-500">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={addTask} className="text-blue-600 text-sm hover:underline mb-4">+ Add Task</button>
            <div className="flex gap-4 mt-4">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Submit Request</button>
              <button type="button" onClick={() => setPage("status")} className="w-full bg-gray-300 text-gray-800 py-2 rounded-xl font-semibold hover:bg-gray-400">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
