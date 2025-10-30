import React, { useEffect, useState, useRef } from 'react';

const STORAGE_KEY = 'student_portfolio_v1';

export default function StudentPortfolio() {
  // student info (very basic)
  const [student, setStudent] = useState({ name: 'John Doe', course: 'MCA' });

  // projects stored as array of objects
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');

  // form state
  const emptyForm = { id: null, title: '', description: '', link: '', tech: '', year: '', featured: false };
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef(null);

  // load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setProjects(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    } else {
      // seed with one sample project
      const seed = [
        { id: Date.now(), title: 'Sample Project', description: 'A starter project', link: '', tech: 'React', year: '2025', featured: true },
      ];
      setProjects(seed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
  }, []);

  // persist projects whenever changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // helper: reset form
  function resetForm() {
    setForm(emptyForm);
    setIsEditing(false);
  }

  // Add or Update project
  function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return alert('Please provide a project title');

    if (isEditing) {
      setProjects(prev => prev.map(p => (p.id === form.id ? { ...form } : p)));
    } else {
      const newProject = { ...form, id: Date.now() };
      setProjects(prev => [newProject, ...prev]);
    }
    resetForm();
  }
 //Added few improvements like scroll to top on edit, clear file input after import
  function handleEdit(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    setForm({ ...p });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id) {
    if (!confirm('Delete this project?')) return;
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  function toggleFeatured(id) {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, featured: !p.featured } : p)));
  }

  // Export JSON - downloads a file
  function exportJSON() {
    const dataStr = JSON.stringify({ student, projects, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_portfolio_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import JSON - merges by default
  function importJSONFile(file, { replace = false } = {}) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.projects || !Array.isArray(parsed.projects)) return alert('Invalid file format: no projects array');
        const incoming = parsed.projects.map(p => ({ ...p, id: p.id ?? Date.now() + Math.random() }));
        if (replace) {
          setProjects(incoming);
        } else {
          // merge without duplicating ids
          const existingIds = new Set(projects.map(p => p.id));
          const merged = [...projects];
          incoming.forEach(ip => {
            if (!existingIds.has(ip.id)) merged.push(ip);
            else {
              // if id exists, create a new id and push
              merged.push({ ...ip, id: Date.now() + Math.random() });
            }
          });
          setProjects(merged);
        }
        alert('Import completed');
      } catch (err) {
        console.error(err);
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const replace = confirm('Replace existing projects with file contents? Click Cancel to merge.');
    importJSONFile(file, { replace });
    // clear the input so same file can be chosen again later
    e.target.value = '';
  }

  const filtered = projects.filter(p => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      (p.tech || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  // small inline styles for a clean base UI
  const s = {
    container: { maxWidth: 900, margin: '18px auto', fontFamily: 'Inter, Roboto, sans-serif' },
    card: { border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    formRow: { display: 'flex', gap: 8, marginBottom: 8 },
    input: { flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' },
    btn: { padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' },
  };

  return (
    <div style={s.container}>
      <h1 style={{ textAlign: 'center' }}>Student Portfolio (LocalStorage)</h1>

      <div style={s.card}>
        <div style={s.header}>
          <div>
            <strong>{student.name}</strong>
            <div style={{ fontSize: 13, color: '#555' }}>{student.course}</div>
          </div>
          <div>
            <button style={{ ...s.btn, marginRight: 8 }} onClick={() => {
              const newName = prompt('Student name', student.name);
              if (newName) setStudent(prev => ({ ...prev, name: newName }));
            }}>Edit Student</button>
            <button style={{ ...s.btn }} onClick={() => { localStorage.removeItem(STORAGE_KEY); setProjects([]); alert('Local storage cleared (projects). Refresh to reseed sample.)'); }}>Clear Saved</button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.formRow}>
            <input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Project title" />
            <input style={s.input} value={form.tech} onChange={e => setForm(f => ({ ...f, tech: e.target.value }))} placeholder="Tech (comma separated)" />
            <input style={{ ...s.input, maxWidth: 140 }} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="Year" />
          </div>
          <div style={s.formRow}>
            <input style={s.input} value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="Project link (optional)" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea style={{ ...s.input, width: '100%', minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ ...s.btn, background: '#1f7aef', color: '#fff' }}>{isEditing ? 'Update Project' : 'Add Project'}</button>
            <button type="button" style={{ ...s.btn }} onClick={resetForm}>Reset</button>
            <label style={{ display: 'inline-block', marginLeft: 'auto' }}>
              <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileSelected} style={{ display: 'none' }} />
              <button type="button" style={{ ...s.btn }} onClick={() => fileInputRef.current?.click()}>Import JSON</button>
            </label>
            <button type="button" style={{ ...s.btn }} onClick={exportJSON}>Export JSON</button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <input placeholder="Search projects by title, tech, description..." value={query} onChange={e => setQuery(e.target.value)} style={{ ...s.input }} />
        <button style={{ ...s.btn }} onClick={() => setQuery('')}>Clear</button>
      </div>

      <div>
        <h3>Projects ({filtered.length})</h3>
        {filtered.length === 0 && <div style={{ color: '#777' }}>No projects found. Add one using the form above.</div>}
        {filtered.map(p => (
          <div key={p.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '600' }}>{p.title} {p.featured && <span style={{ color: '#b76dff', fontSize: 12, marginLeft: 8 }}>[Featured]</span>}</div>
                <div style={{ fontSize: 13, color: '#444' }}>{p.tech} • {p.year} {p.link && <a href={p.link} target="_blank" rel="noreferrer">(link)</a>}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...s.btn }} onClick={() => toggleFeatured(p.id)}>{p.featured ? 'Unfeature' : 'Feature'}</button>
                <button style={{ ...s.btn }} onClick={() => handleEdit(p.id)}>Edit</button>
                <button style={{ ...s.btn, color: 'red' }} onClick={() => handleDelete(p.id)}>Delete</button>
              </div>
            </div>
            <div style={{ marginTop: 8, color: '#333' }}>{p.description}</div>
          </div>
        ))}
      </div>

      <footer style={{ marginTop: 24, fontSize: 13, color: '#666', textAlign: 'center' }}>
        Built for a DevOps lab: localStorage storage, simple UI, JSON import/export, search & feature flag.
      </footer>
    </div>
  );
}
