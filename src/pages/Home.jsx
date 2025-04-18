import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../styles/Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="home-container">
      {/* Floating Particles Background */}
      <div className="floating-particles"></div>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="background-blur"></div>
        <div className="animated-grid"></div>
        
        <div className="hero-content">
          <motion.div 
            className="text-center"
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition}
          >
            <motion.div 
              className="logo-container"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <img 
                src="/logo.svg" 
                alt="Essay Bot" 
                className="logo-image"
              />
            </motion.div>
            
            <h1 className="hero-title">
              <motion.span
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                Welcome to Essay Bot
              </motion.span>
            </h1>
            
            <p className="hero-subtitle">
              Your AI-powered learning assistant that revolutionizes the way you study and learn
            </p>
            
            <div className="cta-buttons">
              <motion.button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                className="primary-button"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/features')}
                className="secondary-button"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-description">
            Essay Bot provides cutting-edge tools to enhance your learning experience
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, type: "spring" }}
              whileHover={{ y: -10 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">What Our Users Say</h2>
        </div>
        
        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="testimonial-card"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="testimonial-content">
                <div className="quote-icon">"</div>
                <p className="testimonial-text">"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <div className="avatar" style={{ backgroundColor: avatarColors[index] }}>
                    {testimonial.initials}
                  </div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-header">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-description">
            Choose the plan that fits your learning needs
          </p>
        </div>
        
        <div className="pricing-cards">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              className={`pricing-card ${plan.featured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -10 }}
            >
              {plan.featured && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">${plan.price}</span>
                <span className="period">/month</span>
              </div>
              <ul className="features-list">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <button className="pricing-button">
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to Transform Your Learning Experience?</h2>
          <p>Join thousands of students already using Essay Bot</p>
          <motion.button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Free Trial
          </motion.button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const avatarColors = ['#6366f1', '#10b981', '#f59e0b'];

const features = [
  {
    title: "AI Essay Writing",
    description: "Generate high-quality essays with our advanced AI technology that understands context and academic requirements.",
    icon: "✍️"
  },
  {
    title: "Smart Grading",
    description: "Get instant feedback on your writing with detailed analysis of grammar, style, and content.",
    icon: "📝"
  },
  {
    title: "Test Preparation",
    description: "Personalized study plans and practice tests tailored to your learning style and pace.",
    icon: "📚"
  },
  {
    title: "Research Assistant",
    description: "Find and summarize academic sources quickly with our AI-powered research tools.",
    icon: "🔍"
  },
  {
    title: "Progress Tracking",
    description: "Visual dashboards to monitor your improvement over time with actionable insights.",
    icon: "📊"
  },
  {
    title: "Collaboration Tools",
    description: "Work seamlessly with peers and instructors in real-time on group projects.",
    icon: "👥"
  }
];

const testimonials = [
  {
    quote: "Essay Bot has completely transformed how I approach my studies. The essay feedback is incredibly detailed and helpful.",
    name: "Sarah Johnson",
    initials: "SJ",
    role: "University Student"
  },
  {
    quote: "As an educator, I recommend Essay Bot to all my students. It's like having a personal tutor available 24/7.",
    name: "Dr. Michael Chen",
    initials: "MC",
    role: "Professor"
  },
  {
    quote: "The test preparation features helped me score in the top 10% of my class. Worth every penny!",
    name: "David Martinez",
    initials: "DM",
    role: "High School Senior"
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "9.99",
    features: [
      "5 AI essays per month",
      "Basic grading feedback",
      "Limited test prep",
      "Email support"
    ],
    featured: false
  },
  {
    name: "Pro",
    price: "19.99",
    features: [
      "20 AI essays per month",
      "Advanced grading feedback",
      "Full test prep access",
      "Priority support",
      "Progress tracking"
    ],
    featured: true
  },
  {
    name: "Institution",
    price: "Custom",
    features: [
      "Unlimited essays",
      "Premium grading feedback",
      "Team collaboration",
      "Dedicated account manager",
      "API access"
    ],
    featured: false
  }
];

export default Home;