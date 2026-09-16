import React from 'react';

const steps = [
  {
    number: '01',
    icon: 'fa-solid fa-pencil',
    title: 'Sketching',
    desc: 'Pencil thumbnails and panel flow laid down by hand — rough layouts that set the story board.',
    points: ['Pencil Thumbnails', 'Panel Flow'],
  },
  {
    number: '02',
    icon: 'fa-solid fa-pen-nib',
    title: 'Inking',
    desc: 'Clean ink lines and a bold indie look — every stroke finished with a nib and steady hand.',
    points: ['Clean Ink Lines', 'Bold Indie Look'],
  },
  {
    number: '03',
    icon: 'fa-solid fa-font',
    title: 'Lettering & Polish',
    desc: 'Speech bubbles, sound effects, and color grading bring each page to life.',
    points: ['Speech Bubbles', 'Sound Effects', 'Color Grading'],
  },
];

export default function ProcessSection() {
  return (
    <section id="workflow" className="bg-[#F5F2EB]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="badge-font text-[#ED3833] text-sm font-extrabold tracking-[0.25em] uppercase mb-3">The Process</p>
          <h2 className="display-font font-black text-[#4A3B32] text-6xl md:text-7xl">
            The Hand-Drawn Workflow
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-[560px] mx-auto">
            No shortcuts — every page of every book moves through the same three handmade stages.
          </p>
        </div>

        {/* Step grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md p-6 border-t-2 border-[#ED3833] h-full flex flex-col"
            >
              {/* Bold numeric badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="badge-font inline-flex items-center justify-center bg-[#ED3833] text-white font-black text-base px-4 py-2 rounded-md shadow-md shadow-[#ED3833]/30">
                  {step.number}
                </span>
                <i className={`${step.icon} text-3xl text-[#ED3833]`}></i>
              </div>

              <h4 className="display-font text-[#4A3B32] text-3xl mb-3">{step.title}</h4>
              <p className="text-gray-500 text-base leading-relaxed mb-4 flex-grow">{step.desc}</p>

              <div className="flex flex-wrap gap-2">
                {step.points.map((point, pIdx) => (
                  <span key={pIdx} className="badge-font bg-[#F5F2EB] text-[#4A3B32] text-xs font-extrabold tracking-wider uppercase px-3.5 py-2 rounded-full">
                    {point}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}