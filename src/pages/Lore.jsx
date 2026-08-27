import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link005 } from "@/components/ui/skiper-ui/skiper40";

export default function Lore() {
  const characters = [
    { name: 'Kaelen', role: 'The Protagonist', desc: 'A young warrior with a mysterious past and a burning desire for justice. He wields the Flame of Aether, an ancient power thought lost forever.', img: 'images/custom/char_kaelen_1787177600102.jpg' },
    { name: 'Lyra', role: 'Master Mage', desc: 'A brilliant tactician who wields elemental magic with devastating precision. She is the last of the Starweavers, a forgotten order of sorcerers.', img: 'images/custom/char_lyra_1787177611766.jpg' },
    { name: 'Draken', role: 'The Antagonist', desc: 'A ruthless warlord seeking to conquer the fractured realms. His power comes from corrupted Aether, twisting the natural order.', img: 'images/custom/char_draken_1787177625172.jpg' },
    { name: 'Elara', role: 'The Guide', desc: 'An ancient spirit trapped in human form, guiding Kaelen on his journey. She remembers the world before the Great Cataclysm.', img: 'images/custom/char_elara_1787177638388.jpg' },
  ];

  const loreEntries = [
    { title: 'The Great Cataclysm', text: 'A catastrophic event that shattered the unified continent into floating islands. The cause remains a mystery, but ancient texts speak of a forbidden ritual gone wrong.', icon: 'fa-burst' },
    { title: 'The Floating Isles', text: 'Civilizations now thrive on massive landmasses suspended over an endless abyss. Airships connect the isles, and elemental magic powers daily life.', icon: 'fa-cloud' },
    { title: 'The Aether War', text: 'A devastating conflict between the Elemental Council and Draken\'s forces. The war reshaped political boundaries and left entire islands in ruins.', icon: 'fa-shield-halved' },
    { title: 'The Flame of Aether', text: 'An ancient power source tied to the creation of the world. Only one being can wield its full potential without being consumed by its energy.', icon: 'fa-fire' },
  ];

  return (
    <div className="min-h-screen text-zinc-900 font-sans pb-16">
      {/* World Wiki Section */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-4 text-red-500 border-red-500/30">
              World Wiki
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              The Fractured Realms
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed">
              The universe of Greyfire Studio is vast, filled with ancient magic, warring factions, and forgotten history.
              The Fractured Realms were once a unified continent until the Great Cataclysm shattered the land.
              Now, surviving civilizations live on floating islands suspended over an endless abyss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loreEntries.map((entry, idx) => (
              <Card key={idx} className="bg-white border-zinc-200 hover:border-red-500 transition-all duration-300 hover:-translate-y-1 shadow-sm">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center mb-4 shadow-lg shadow-red-600/20">
                    <i className={`fa-solid ${entry.icon} text-white text-xl`}></i>
                  </div>
                  <CardTitle className="text-xl text-zinc-900">{entry.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-zinc-600 leading-relaxed">{entry.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <hr className="border-zinc-200 my-8" />
      </div>

      {/* Character Bios Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-red-500 border-red-500/30">
              Character Bios
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
              Meet the Core Cast
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {characters.map((char, idx) => (
              <Card key={idx} className="bg-white border-zinc-200 overflow-hidden group shadow-sm">
                <div className="relative pt-6 px-6">
                  <div className="aspect-square rounded-full overflow-hidden border-4 border-zinc-100 group-hover:border-red-500 transition-colors duration-500">
                    <img 
                      src={char.img} 
                      alt={char.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-zinc-900">{char.name}</CardTitle>
                  <p className="text-sm font-medium text-red-600">{char.role}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-zinc-600 leading-relaxed mb-6">{char.desc}</p>
                  
                  <div className="flex justify-center space-x-4">
                    <a href="#" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-red-500 transition-colors">
                      <i className="fa-brands fa-facebook-f text-sm"></i>
                    </a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-red-500 transition-colors">
                      <i className="fa-brands fa-twitter text-sm"></i>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-50 p-8 rounded-2xl border border-zinc-200">
            <div className="mb-6 sm:mb-0">
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">Want to know more?</h3>
              <p className="text-zinc-600 text-sm">Reach out to us to explore the full story.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link005 href="mailto:contact@greyfire.com" className="text-red-500 font-medium py-2">
                Contact Us
              </Link005>
              <Link to="/reader">
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-5">
                  Start Reading <i className="fa-solid fa-arrow-right ml-2"></i>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
