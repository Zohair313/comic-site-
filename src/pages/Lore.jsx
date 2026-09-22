import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Lore() {
  const characters = [
    { name: 'Kaelen', role: 'The Protagonist', desc: 'A young warrior with a mysterious past and a burning desire for justice. He wields the Flame of Aether, an ancient power thought lost forever.', img: 'images/custom/char_kaelen_1787177600102.jpg' },
    { name: 'Lyra', role: 'Master Mage', desc: 'A brilliant tactician who wields elemental magic with devastating precision. She is the last of the Starweavers, a forgotten order of sorcerers.', img: 'images/custom/char_lyra_1787177611766.jpg' },
    { name: 'Draken', role: 'The Antagonist', desc: 'A ruthless warlord seeking to conquer the fractured realms. His power comes from corrupted Aether, twisting the natural order.', img: 'images/custom/char_draken_1787177625172.jpg' },
    { name: 'Elara', role: 'The Guide', desc: 'An ancient spirit trapped in human form, guiding Kaelen on his journey. She remembers the world before the Great Cataclysm.', img: 'images/custom/char_elara_1787177638388.jpg' },
  ];

  return (
    <div className="min-h-screen text-zinc-900 font-sans pb-16">
      {/* Character Bios Section */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-[#879F84] border-[#879F84]/30">
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
                  <div className="aspect-square rounded-full overflow-hidden border-4 border-zinc-100 group-hover:border-[#ED3833] transition-colors duration-500">
                    <img 
                      src={char.img} 
                      alt={char.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-zinc-900">{char.name}</CardTitle>
                  <p className="text-sm font-medium text-[#879F84]">{char.role}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-zinc-600 leading-relaxed mb-6">{char.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
