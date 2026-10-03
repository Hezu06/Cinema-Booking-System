import React from 'react';
import { Link } from 'react-router-dom';
import { TicketorLogo } from './TicketorLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-24 border-t border-[#1C1C24] bg-[#07070A] text-[#8E8E9E] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-28 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <TicketorLogo size="md" />
            <p className="text-xs text-[#8E8E9E] leading-relaxed max-w-sm">
              Ticketor is your premier digital cinema booking companion. Discover trending blockbusters, reserve best-in-house seats in real time, and enjoy unforgettable film experiences.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#262633] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FCFC65] transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#262633] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FCFC65] transition-colors font-bold text-xs"
              >
                𝕏
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#262633] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FCFC65] transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect width="4" height="12" x="2" y="9"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>

            <div className="text-[11px] text-[#5A5A6E] pt-2">
              Copyright © 2016 - 2026 Ticketor. All right reserved.
              <span className="mx-2">·</span>
              <a href="#privacy" className="hover:text-gray-300">Privacy Policy</a>
              <span className="mx-2">·</span>
              <a href="#terms" className="hover:text-gray-300">Terms of service</a>
            </div>
          </div>

          {/* Nav Column 1: Find a Movie */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider mb-4">Find a Movie</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/?filter=now_showing" className="hover:text-white transition-colors">
                  In Theaters
                </Link>
              </li>
              <li>
                <Link to="/?filter=top_movies" className="hover:text-white transition-colors">
                  Top Movies
                </Link>
              </li>
              <li>
                <Link to="/?filter=coming_soon" className="hover:text-white transition-colors">
                  Coming Soon
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 2: Company */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#about" className="hover:text-white transition-colors">About Us</a>
              </li>
              <li>
                <a href="#partnerships" className="hover:text-white transition-colors">Partnerships</a>
              </li>
              <li>
                <a href="#app" className="hover:text-white transition-colors">Get the App</a>
              </li>
            </ul>
          </div>

          {/* Nav Column 3: Help */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider mb-4">Help</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#contact" className="hover:text-white transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#subscription" className="hover:text-white transition-colors">Subscription</a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Audience Silhouette Ambient Decor */}
      <div className="w-full h-16 sm:h-24 bg-gradient-to-t from-black via-black/80 to-transparent relative opacity-70">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-[#050507]">
          <path d="M0,120 L0,90 Q50,60 100,90 Q150,55 200,90 Q250,50 300,90 Q350,65 400,90 Q450,45 500,90 Q550,60 600,90 Q650,50 700,90 Q750,70 800,90 Q850,55 900,90 Q950,60 1000,90 Q1050,50 1100,90 Q1150,65 1200,90 L1200,120 Z" />
        </svg>
      </div>
    </footer>
  );
};
