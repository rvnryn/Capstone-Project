import React, { useState } from "react";

interface HolidayFormProps {
  initial?: {
    date: string;
    name: string;
    description?: string;
  };
  onSave: (data: { date: string; name: string; description?: string }) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isEdit?: boolean;
}

export default function HolidayFormModal({
  initial,
  onSave,
  onCancel,
  onDelete,
  isEdit = false,
}: HolidayFormProps) {
  const [date, setDate] = useState(initial?.date || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSave({ date, name, description });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        className="bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-400"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-bold text-blue-300 mb-4">
          {isEdit ? "Edit Holiday/Event" : "Add Holiday/Event"}
        </h2>
        <div className="mb-3">
          <label className="block text-blue-200 text-sm mb-1">Date</label>
          <input
            type="date"
            className="w-full rounded border border-blue-400 bg-slate-800 text-white px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isEdit}
          />
        </div>
        <div className="mb-3">
          <label className="block text-blue-200 text-sm mb-1">Name</label>
          <input
            type="text"
            className="w-full rounded border border-blue-400 bg-slate-800 text-white px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-blue-200 text-sm mb-1">
            Description
          </label>
          <textarea
            className="w-full rounded border border-blue-400 bg-slate-800 text-white px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex gap-2 justify-end">
          {isEdit && onDelete && (
            <button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
              onClick={onDelete}
              disabled={loading}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
            disabled={loading}
          >
            {isEdit ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
