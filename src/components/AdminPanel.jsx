import { useEffect, useState } from 'react'
import { FaCalendarAlt, FaCloudUploadAlt, FaImages, FaQuoteLeft, FaTrash, FaVideo } from 'react-icons/fa'
import { auth, db, isFirebaseConfigured, storage } from '../lib/firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

const seed = {
  gallery: [],
  testimonials: [],
  bookings: [],
  reels: [],
}

export default function AdminPanel() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('login')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [content, setContent] = useState(seed)
  const [testimonial, setTestimonial] = useState({ name: '', role: '', quote: '', city: '', image: '' })
  const [homepage, setHomepage] = useState({ heroTitle: 'Effortlessly Lavish Experiences', heroSubtitle: 'Luxury Weddings • Royal Celebrations • Elite Events' })
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState(null)
  const metrics = [
    { label: 'Bookings', value: content.bookings.length, icon: <FaCalendarAlt /> },
    { label: 'Gallery Assets', value: content.gallery.length, icon: <FaImages /> },
    { label: 'Reels', value: content.reels.length, icon: <FaVideo /> },
    { label: 'Testimonials', value: content.testimonials.length, icon: <FaQuoteLeft /> },
  ]

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return
    return onAuthStateChanged(auth, setUser)
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) return
    const stops = Object.keys(seed).map((key) =>
      onSnapshot(collection(db, key), (snapshot) => {
        setContent((current) => ({ ...current, [key]: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) }))
      }),
    )
    return () => stops.forEach((stop) => stop())
  }, [user])

  const localUpload = (file, bucket) => {
    const url = URL.createObjectURL(file)
    setContent((current) => ({ ...current, [bucket]: [{ id: crypto.randomUUID(), url, name: file.name }, ...current[bucket]] }))
  }

  const handleFile = async (event, bucket) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    if (!isFirebaseConfigured || !storage || !db) {
      localUpload(file, bucket)
      return
    }
    const fileRef = ref(storage, `${bucket}/${Date.now()}-${file.name}`)
    await uploadBytes(fileRef, file)
    const url = await getDownloadURL(fileRef)
    await addDoc(collection(db, bucket), { url, name: file.name, createdAt: serverTimestamp() })
  }

  const handleDrop = async (event, bucket) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    await handleFile({ target: { files: [file] } }, bucket)
  }

  const handleAuth = async (event) => {
    event.preventDefault()
    if (!isFirebaseConfigured || !auth) {
      setUser({ email: credentials.email || 'demo@royalvelvet.local' })
      return
    }
    if (mode === 'signup') {
      await createUserWithEmailAndPassword(auth, credentials.email, credentials.password)
    } else {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
    }
  }

  const addTestimonial = async (event) => {
    event.preventDefault()
    if (!isFirebaseConfigured || !db) {
      setContent((current) => ({
        ...current,
        testimonials: [{ id: crypto.randomUUID(), ...testimonial }, ...current.testimonials],
      }))
    } else {
      await addDoc(collection(db, 'testimonials'), testimonial)
    }
    setTestimonial({ name: '', role: '', quote: '', city: '', image: '' })
  }

  const removeItem = async (bucket, id) => {
    if (!isFirebaseConfigured || !db) {
      setContent((current) => ({ ...current, [bucket]: current[bucket].filter((item) => item.id !== id) }))
      return
    }
    await deleteDoc(doc(db, bucket, id))
  }

  const saveHomepage = async (event) => {
    event.preventDefault()
    localStorage.setItem('rve-homepage', JSON.stringify(homepage))
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'site', 'homepage'), homepage)
    }
    setStatus('Homepage content ready to publish.')
  }

  if (!user) {
    return (
      <main className="admin-shell auth-shell">
        <form className="glass-card admin-card" onSubmit={handleAuth}>
          <p className="eyebrow">Admin</p>
          <h1>{mode === 'login' ? 'Secure Login' : 'Create Admin'}</h1>
          <input placeholder="Email" type="email" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} />
          <input placeholder="Password" type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} />
          <button className="btn btn-primary" type="submit">{mode === 'login' ? 'Enter Dashboard' : 'Create Account'}</button>
          <button className="text-button" type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Need an admin account?' : 'Already have access?'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>RoyalVelvetEvents Admin</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => (isFirebaseConfigured && auth ? signOut(auth) : setUser(null))}>Sign Out</button>
      </header>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="glass-card metric-card" key={metric.label}>
            <span>{metric.icon}</span>
            <strong>{metric.value}</strong>
            <small>{metric.label}</small>
          </article>
        ))}
      </section>

      <section className="admin-grid">
        <article
          className="glass-card admin-card upload-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, 'gallery')}
        >
          <FaCloudUploadAlt />
          <h2>Upload Event Photos</h2>
          <input type="file" accept="image/*" onChange={(event) => handleFile(event, 'gallery')} />
          <p>Drag-and-drop friendly once Firebase Storage is connected.</p>
          {preview && <img src={preview} alt="Preview" />}
        </article>

        <article
          className="glass-card admin-card upload-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, 'reels')}
        >
          <FaCloudUploadAlt />
          <h2>Upload Reels / Videos</h2>
          <input type="file" accept="video/*" onChange={(event) => handleFile(event, 'reels')} />
          <p>Preview before publish keeps the feed polished.</p>
        </article>

        <form className="glass-card admin-card testimonial-editor" onSubmit={addTestimonial}>
          <h2>Post Testimonial</h2>
          <div className="admin-form-grid">
            <input placeholder="Client Name" value={testimonial.name} onChange={(e) => setTestimonial({ ...testimonial, name: e.target.value })} />
            <input placeholder="City" value={testimonial.city} onChange={(e) => setTestimonial({ ...testimonial, city: e.target.value })} />
            <input placeholder="Event Type" value={testimonial.role} onChange={(e) => setTestimonial({ ...testimonial, role: e.target.value })} />
            <input placeholder="Image URL" value={testimonial.image} onChange={(e) => setTestimonial({ ...testimonial, image: e.target.value })} />
          </div>
          <textarea placeholder="Client quote" value={testimonial.quote} onChange={(e) => setTestimonial({ ...testimonial, quote: e.target.value })} />
          <button className="btn btn-primary">Publish Testimonial</button>
        </form>

        <form className="glass-card admin-card" onSubmit={saveHomepage}>
          <h2>Homepage Content</h2>
          <input value={homepage.heroTitle} onChange={(e) => setHomepage({ ...homepage, heroTitle: e.target.value })} />
          <input value={homepage.heroSubtitle} onChange={(e) => setHomepage({ ...homepage, heroSubtitle: e.target.value })} />
          <button className="btn btn-primary">Save Draft</button>
          {status && <small>{status}</small>}
        </form>
      </section>

      <section className="glass-card analytics-panel">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Executive Snapshot</h2>
        </div>
        <div className="analytics-bars">
          {[
            ['Lead Response Readiness', 92],
            ['Content Completeness', Math.min(100, 35 + content.gallery.length * 8 + content.testimonials.length * 12)],
            ['Media Library Strength', Math.min(100, content.gallery.length * 12 + content.reels.length * 16)],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <div><i style={{ width: `${value}%` }} /></div>
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-lists">
        {[
          ['gallery', 'Gallery'],
          ['reels', 'Reels'],
          ['testimonials', 'Testimonials'],
          ['bookings', 'Bookings'],
        ].map(([bucket, title]) => (
          <article className="glass-card admin-card" key={bucket}>
            <h2>{title}</h2>
            <div className="admin-items">
              {content[bucket].length === 0 && <p>No items yet.</p>}
              {content[bucket].map((item) => (
                <div key={item.id}>
                  <span>{item.name || item.email || item.quote || 'Untitled item'}</span>
                  <button onClick={() => removeItem(bucket, item.id)}><FaTrash /></button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="glass-card admin-card testimonial-library">
        <div>
          <p className="eyebrow">Testimonials</p>
          <h2>Published Client Stories</h2>
        </div>
        <div className="testimonial-admin-grid">
          {content.testimonials.length === 0 && <p>No testimonials published yet.</p>}
          {content.testimonials.map((item) => (
            <article key={item.id}>
              {item.image && <img src={item.image} alt={item.name} />}
              <strong>{item.name}</strong>
              <span>{[item.city, item.role].filter(Boolean).join(' • ')}</span>
              <p>{item.quote}</p>
              <button onClick={() => removeItem('testimonials', item.id)}><FaTrash /></button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
