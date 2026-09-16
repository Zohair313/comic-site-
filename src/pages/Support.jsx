import React from 'react';

export default function Support() {
  return (
    <section className="py-24 min-h-[60vh] flex items-center">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4" style={{ WebkitTextStroke: '0px' }}>Support the Creator</h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            If you love the comics and want to help me continue creating, consider dropping a tip!
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-sm border border-zinc-200">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-10 transform translate-x-1/3 -translate-y-1/3" style={{ backgroundColor: '#ED3833' }}></div>
            
            <div className="relative z-10 text-center">
              <h3 className="text-3xl font-bold text-zinc-900 mb-2">Tip Jar</h3>
              <p className="text-zinc-600 mb-8">Buy me a coffee and get my eternal gratitude!</p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button className="px-6 py-3 rounded-full font-bold text-[#ED3833] transition-all duration-300" style={{ backgroundColor: 'rgba(237,56,51,0.05)', border: '1px solid #ED3833' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ED3833'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(237,56,51,0.05)'; e.currentTarget.style.color = '#ED3833'; }}>$5</button>
                <button className="px-6 py-3 rounded-full font-bold text-[#ED3833] transition-all duration-300" style={{ backgroundColor: 'rgba(237,56,51,0.05)', border: '1px solid #ED3833' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ED3833'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(237,56,51,0.05)'; e.currentTarget.style.color = '#ED3833'; }}>$10</button>
                <button className="px-6 py-3 rounded-full font-bold text-[#ED3833] transition-all duration-300" style={{ backgroundColor: 'rgba(237,56,51,0.05)', border: '1px solid #ED3833' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ED3833'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(237,56,51,0.05)'; e.currentTarget.style.color = '#ED3833'; }}>$20</button>
              </div>
              
              <button 
                className="w-full py-4 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-[rgba(237,56,51,0.4)]" 
                style={{ backgroundColor: '#ED3833' }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c92825'} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ED3833'}
                onClick={() => alert("Redirecting to PayPal...")}
              >
                <i className="fa-brands fa-paypal me-2"></i> Support via PayPal
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
