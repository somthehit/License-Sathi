import { Link } from 'react-router-dom';
import { BookOpen, FileCheck, Trophy, ArrowRight } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function Dashboard() {
  return (
    <div className="container" style={{ padding: '3rem 2rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Welcome to License Sathi
        </h1>
        <p className="text-muted" style={{ fontSize: '1.25rem' }}>
          Your premium driving license preparation platform.
        </p>
      </header>

      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        {/* Practice Mode */}
        <Card interactive style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-full)' }}>
              <BookOpen size={32} color="var(--color-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Practice Mode</h2>
              <span className="badge badge-success">Learn</span>
            </div>
          </div>
          <p className="text-muted" style={{ flexGrow: 1 }}>
            Master all driving rules and traffic signs category by category with instant feedback.
          </p>
          <Link to="/practice" style={{ display: 'block' }}>
            <Button style={{ width: '100%' }}>
              Start Practicing <ArrowRight size={18} />
            </Button>
          </Link>
        </Card>

        {/* Mock Exam */}
        <Card interactive style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(253, 203, 110, 0.1)', borderRadius: 'var(--radius-full)' }}>
              <FileCheck size={32} color="var(--color-warning)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mock Exam</h2>
              <span className="badge badge-warning">Test</span>
            </div>
          </div>
          <p className="text-muted" style={{ flexGrow: 1 }}>
            Take a simulated 30-minute exam to evaluate your readiness for the real test.
          </p>
          <Link to="/mock-exam" style={{ display: 'block' }}>
            <Button style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-warning) 0%, #E1B12C 100%)', color: '#2D3436' }}>
              Take Mock Exam <ArrowRight size={18} />
            </Button>
          </Link>
        </Card>

        {/* Progress */}
        <Card interactive style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(0, 184, 148, 0.1)', borderRadius: 'var(--radius-full)' }}>
              <Trophy size={32} color="var(--color-success)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>My Progress</h2>
              <span className="badge badge-primary">Track</span>
            </div>
          </div>
          <p className="text-muted" style={{ flexGrow: 1 }}>
            View your attempt history, track your improvement, and see earned badges.
          </p>
          <Link to="/progress" style={{ display: 'block' }}>
            <Button variant="secondary" style={{ width: '100%' }}>
              View Progress <ArrowRight size={18} />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Quick Stats / Readiness */}
      <section className="card glass" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Exam Readiness</h2>
        <div style={{ 
          width: '150px', 
          height: '150px', 
          margin: '0 auto 1.5rem',
          borderRadius: '50%',
          border: '8px solid var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: 'var(--color-primary)'
        }}>
          0%
        </div>
        <p className="text-muted">Complete more mock exams to calculate your readiness score.</p>
      </section>
    </div>
  );
}
