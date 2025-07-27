import React, { useEffect, useState } from "react";

const API = "https://tech-dash-api.onrender.com";

export default function App() {
  const [page, setPage] = useState("status");
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ wip: "", reg: "", work: "", overallLabour: "", tasks: [] });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(API + "/requests").then(res => res.json()).then(setRequests);
  }, []);

  const addTask = () => {
    setForm({ ...form, tasks: [...form.tasks, { desc: "", time: 0, parts: false, approved: false }] });
  };

  const updateTask = (index, field, value) => {
    const tasks = [...form.tasks];
    tasks[index][field] = value;
    setForm({ ...form, tasks });
  };

  const removeTask = (index) => {
    const tasks = [...form.tasks];
    tasks.splice(index, 1);
    setForm({ ...form, tasks });
  };

  const submitForm = (e) => {
    e.preventDefault();
    fetch(API + "/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "Pending" })
    }).then(res => res.json()).then(data => {
      setRequests([...requests, data]);
      setPage("status");
    });
  };

  const saveStatusUpdate = () => {
    fetch(API + "/requests/" + selected.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: selected.tasks, status: selected.status })
    }).then(() => {
      setRequests(requests.map(r => r.id === selected.id ? selected : r));
      setPage("status");
    });
  };

  const totalLabour = (r, approvedOnly = false) => {
    if (r.overallLabour) return parseFloat(r.overallLabour);
    const list = Array.isArray(r.tasks) ? r.tasks : [];
    return list.reduce((sum, t) => {
      if (approvedOnly && !t.approved) return sum;
      return sum + parseFloat(t.time || 0);
    }, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Authorised": return "bg-green-600";
      case "Partially approved": return "bg-yellow-400";
      case "Declined": return "bg-red-500";
      case "Awaiting customer contact": return "bg-orange-400";
      default: return "bg-gray-400";
    }
  };

  const approvedHours = requests
    .filter(r => r.status === "Authorised")
    .reduce((a, r) => a + totalLabour(r, true), 0);

  const requestedHours = requests
    .filter(r => ["Pending", "Declined", "Awaiting customer contact", "Partially approved"].includes(r.status))
    .reduce((a, r) => a + totalLabour(r), 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl p-6">
        {page !== "status" && (
          <button onClick={() => setPage("status")} className="text-blue-600 text-sm mb-4">← Back</button>
        )}

        {page === "status" && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Tech Dash</h1>
            <p className="text-center text-gray-600 mb-4">Vehicle Repair Authorisation System</p>

            <div className="flex justify-between text-sm text-gray-700 mb-4">
              <div><strong>Hours approved:</strong> {approvedHours.toFixed(1)} hrs</div>
              <div><strong>Hours requested:</strong> {requestedHours.toFixed(1)} hrs</div>
            </div>

            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">WIP</th><th>Reg</th><th>Work</th><th>Status</th><th>Approved hrs</th><th>Requested hrs</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => { setSelected(r); setPage("view"); }}>
                    <td className="p-2">{r.wip}</td>
                    <td>{r.reg}</td>
                    <td>{r.work}</td>
                    <td><span className={`text-white text-xs px-2 py-1 rounded-full ${getStatusColor(r.status)}`}>{r.status}</span></td>
                    <td>{totalLabour(r, true).toFixed(1)}</td>
                    <td>{totalLabour(r).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-center mt-6">
              <button onClick={() => { setForm({ wip: "", reg: "", work: "", overallLabour: "", tasks: [] }); setPage("form"); }} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Add New Request
              </button>
            </div>
          </>
        )}

        {page === "form" && (
          <form onSubmit={submitForm}>
            <input required placeholder="WIP Number" value={form.wip} onChange={e => setForm({ ...form, wip: e.target.value })} className="border px-3 py-2 rounded mb-2 w-full" />
            <input required placeholder="Registration" value={form.reg} onChange={e => setForm({ ...form, reg: e.target.value })} className="border px-3 py-2 rounded mb-2 w-full" />
            <textarea required placeholder="Work Description" value={form.work} onChange={e => setForm({ ...form, work: e.target.value })} className="border px-3 py-2 rounded mb-2 w-full" rows={2} />
            <input type="number" step="0.1" placeholder="Overall Labour Time (optional)" value={form.overallLabour} onChange={e => setForm({ ...form, overallLabour: e.target.value })} className="border px-3 py-2 rounded mb-4 w-full" />

            {form.tasks.map((t, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Task" value={t.desc} onChange={e => updateTask(i, "desc", e.target.value)} className="border px-2 py-1 rounded w-full" />
                <input type="number" step="0.1" value={t.time} onChange={e => updateTask(i, "time", parseFloat(e.target.value))} className="w-20 border text-center px-2 py-1 rounded" />
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={t.parts} onChange={e => updateTask(i, "parts", e.target.checked)} />Parts?</label>
                <button type="button" onClick={() => removeTask(i)} className="text-red-500 text-sm">✕</button>
              </div>
            ))}
            <button type="button" onClick={addTask} className="text-blue-600 text-sm mb-4">+ Add Task</button>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Submit Request</button>
          </form>
        )}

        {page === "view" && selected && (
          <div>
            <h2 className="text-xl font-bold mb-2">Request Details</h2>
            <p className="mb-1"><strong>WIP:</strong> {selected.wip}</p>
            <p className="mb-1"><strong>Reg:</strong> {selected.reg}</p>
            <p className="mb-1"><strong>Work:</strong> {selected.work}</p>
            <p className="mb-4"><strong>Status:</strong> {selected.status}</p>

            {(selected.tasks || []).map((t, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input value={t.desc} readOnly className="border px-2 py-1 rounded w-full bg-gray-100" />
                <input value={t.time} readOnly className="w-20 border text-center px-2 py-1 rounded bg-gray-100" />
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={t.parts} readOnly />Parts?</label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={t.approved} onChange={e => {
                    const updated = { ...selected };
                    updated.tasks[i].approved = e.target.checked;
                    setSelected(updated);
                  }} />
                  Approved
                </label>
              </div>
            ))}

            <div className="mt-4">
              <button onClick={saveStatusUpdate} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
