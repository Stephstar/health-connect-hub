import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Video, Calendar, Shield, Brain, MessageSquare, CreditCard, 
  Star, ArrowRight, Heart, Users, Clock, CheckCircle2,
  Phone, Mail, MapPin
} from 'lucide-react';

const features = [
  { icon: Video, title: 'Video Consultations', desc: 'Connect with certified doctors from anywhere via HD video calls' },
  { icon: Calendar, title: 'Easy Scheduling', desc: 'Book appointments in seconds with our smart calendar system' },
  { icon: Shield, title: 'Secure & Private', desc: 'HIPAA-compliant platform with end-to-end encryption' },
  { icon: Brain, title: 'AI Health Assistant', desc: 'Get instant symptom assessment and health recommendations' },
  { icon: MessageSquare, title: 'Secure Messaging', desc: 'Chat with your healthcare team anytime, anywhere' },
  { icon: CreditCard, title: 'Flexible Payments', desc: 'Multiple payment options including insurance and mobile money' },
];

const stats = [
  { value: '50K+', label: 'Patients Served' },
  { value: '500+', label: 'Licensed Doctors' },
  { value: '4.9', label: 'Average Rating' },
  { value: '24/7', label: 'Available' },
];

const testimonials = [
  { name: 'Amara N.', role: 'Patient', text: 'MediConnect made it so easy to see a specialist without traveling hours. The video quality was excellent.', rating: 5 },
  { name: 'Dr. James K.', role: 'Cardiologist', text: 'The platform streamlines my practice. I can manage patients, prescriptions, and consultations all in one place.', rating: 5 },
  { name: 'Grace O.', role: 'Patient', text: 'The AI symptom checker gave me peace of mind at 2 AM when I was worried about my child\'s fever.', rating: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-heading text-foreground">MediConnect</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Log In</Link></Button>
            <Button asChild><Link to="/signup">Get Started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
              <span className="text-sm font-medium text-primary">Trusted by 50,000+ patients</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-heading tracking-tight text-foreground mb-6 leading-tight">
              Healthcare at Your <br />
              <span className="text-gradient-primary">Fingertips</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect with top-rated doctors, book appointments, and manage your health — all from the comfort of your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base px-8 h-12" asChild>
                <Link to="/signup">Start Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                <Link to="/signup?role=doctor">Join as a Doctor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold font-heading text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">A complete telemedicine platform designed for patients, doctors, and healthcare organizations.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <Card key={f.title} className="p-6 shadow-card hover:shadow-card-hover transition-shadow group cursor-pointer">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold font-heading text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up in seconds and complete your health profile', icon: Users },
              { step: '02', title: 'Book Appointment', desc: 'Choose a doctor, pick a time, and select consultation type', icon: Calendar },
              { step: '03', title: 'Get Care', desc: 'Connect via video call and receive your treatment plan', icon: CheckCircle2 },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="relative mx-auto mb-6 h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-primary-foreground" />
                  <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold font-heading text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" asChild><Link to="/signup">Get Started Now <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">What Our Users Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map(t => (
              <Card key={t.name} className="p-6 shadow-card">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-foreground text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl gradient-primary p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-primary-foreground mb-4">Ready to Transform Your Healthcare?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">Join thousands of patients and doctors who trust MediConnect for accessible, affordable healthcare.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-base px-8 h-12" asChild>
                <Link to="/signup">Create Free Account</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold font-heading">MediConnect</span>
              </div>
              <p className="text-sm text-muted-foreground">Making quality healthcare accessible to everyone, everywhere.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Platform</h4>
              <div className="space-y-2">
                <Link to="/signup" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">For Patients</Link>
                <Link to="/signup?role=doctor" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">For Doctors</Link>
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Support</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" /> support@mediconnect.com</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> +1 (800) 555-0123</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> San Francisco, CA</div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 MediConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
