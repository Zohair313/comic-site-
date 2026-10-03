import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSiteData } from '@/context/SiteDataContext';
import { resolveSrc } from '@/lib/api';
import { characterProduct, centsToDollars } from '@/lib/characters';

export default function Lore() {
  const { data } = useSiteData();
  const lore = data.lore;
  const characters = lore.characters;

  return (
    <div className="min-h-screen text-zinc-900 font-sans pb-16">
      {/* Character Bios Section */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-[#879F84] border-[#879F84]/30">
              {lore.badge}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
              {lore.heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {characters.map((char, idx) => {
              const product = characterProduct(char);
              return (
                <Card key={idx} className="bg-white border-zinc-200 overflow-hidden group shadow-sm flex flex-col">
                  <div className="relative pt-6 px-6">
                    <div className="aspect-square rounded-full overflow-hidden border-4 border-zinc-100 group-hover:border-[#ED3833] transition-colors duration-500">
                      <img
                        src={resolveSrc(char.img)}
                        alt={char.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </div>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-zinc-900">{char.name}</CardTitle>
                    <p className="text-sm font-medium text-[#879F84]">{char.role}</p>
                  </CardHeader>
                  <CardContent className="text-center flex flex-col flex-1">
                    <p className="text-sm text-zinc-600 leading-relaxed mb-6">{char.desc}</p>

                    {product && (
                      <div className="mt-auto">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Character Pack</span>
                          <span className="display-font font-black text-2xl text-[#ED3833]">${centsToDollars(product.priceCents)}</span>
                        </div>
                        <Link
                          to={`/checkout?add=${encodeURIComponent(product.id)}`}
                          className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-full bg-[#ED3833] text-white font-extrabold text-sm hover:bg-[#c92825] transition-colors"
                        >
                          <i className="fa-solid fa-cart-shopping"></i> Buy {char.name}
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
