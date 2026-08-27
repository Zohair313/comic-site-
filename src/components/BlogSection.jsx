import React from 'react';

export default function BlogSection() {
  return (
    <section id="blog" className="py-24 bg-zinc-50">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="mb-16">
          <span className="text-red-600 font-black tracking-widest uppercase text-sm mb-2 block">Blogs</span>
          <h3 className="text-4xl md:text-5xl font-black text-zinc-900 uppercase tracking-tight">Our Top Trendy<br/>Comic News.</h3>
        </div>

        {/* Blog Item */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center">
            
            {/* Number Indicator (Optional, replacing the weird stroked 01) */}
            <div className="hidden md:flex md:w-1/12 justify-center items-center">
              <span className="text-5xl font-black text-gray-200" style={{ WebkitTextStroke: '0px' }}>01</span>
            </div>

            {/* Blog Image */}
            <div className="w-full md:w-5/12 p-4 md:p-6">
              <div className="rounded-xl overflow-hidden shadow-lg group cursor-pointer relative">
                <img 
                  src="/images/intro_post.jpeg" 
                  alt="Intro Post" 
                  className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-300"></div>
              </div>
            </div>

            {/* Blog Content */}
            <div className="w-full md:w-6/12 p-8 md:p-12">
              <span className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 font-bold text-xs uppercase tracking-wider rounded-full mb-4">Announcement</span>
              
              <a href="#" className="block group">
                <h4 className="text-3xl font-black text-zinc-900 group-hover:text-red-600 transition-colors mb-4" style={{ WebkitTextStroke: '0px' }}>
                  Intro Post: A New Adventure Begins
                </h4>
              </a>
              
              <p className="text-zinc-600 text-lg mb-8 leading-relaxed">
                Welcome to our brand new comic reading platform! We are thrilled to share our passion for incredible storytelling, stunning artwork, and immersive worlds. Join us as we explore the endless possibilities of the comic universe, starting with this special introductory update. Grab a cup of your favorite drink, head into the forest of imagination, and let the adventure unfold!
              </p>
              
              {/* Author Info */}
              <div className="flex items-center gap-4">
                <img 
                  src="/images/intro_post.jpeg" 
                  alt="Author" 
                  className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white"
                />
                <div>
                  <h5 className="font-bold text-zinc-900 m-0">Greyfire Studio</h5>
                  <p className="text-sm text-zinc-500 m-0 font-medium">August 22, 2026</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}