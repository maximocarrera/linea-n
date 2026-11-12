/**
 * Datos iniciales de la base (solo los usa `npm run db:seed`).
 * Desde ahora las preguntas se editan en server/data/linean.db.
 *
 * Formato compacto: { puntos: "Respuesta|alias|alias, Otra respuesta, ..." }
 * El primer nombre de cada entrada es la respuesta principal; el resto son alias.
 * 10 = común · 30 = poco común · 60 = rara · 100 = de nicho
 */
function q(_slug, category, prompt, tiers) {
  const answers = [];
  for (const [points, list] of Object.entries(tiers)) {
    for (const entry of list.split(',')) {
      const [answer, ...aliases] = entry.split('|').map((s) => s.trim()).filter(Boolean);
      if (answer) answers.push({ answer, aliases: aliases.join('|'), points: Number(points) });
    }
  }
  return { category, prompt, answers };
}

export const SEED_QUESTIONS = [
  q('paises-b', 'Geografía', 'Nombrá un país que empiece con B', {
    10: 'Brasil|Brazil, Bolivia, Bélgica|Belgica',
    30: 'Bulgaria, Bahamas, Bangladés|Bangladesh, Bosnia y Herzegovina|Bosnia',
    60: 'Bielorrusia|Belarus, Botsuana|Botswana, Barbados, Belice|Belize, Baréin|Bahrein|Bahrain',
    100: 'Benín|Benin, Brunéi|Brunei, Burundi, Bután|Butan|Bhutan, Burkina Faso',
  }),
  q('capitales-europa', 'Geografía', 'Nombrá una capital europea', {
    10: 'Madrid, París, Roma, Londres, Berlín',
    30: 'Lisboa, Atenas, Viena, Ámsterdam|Amsterdam, Bruselas, Dublín',
    60: 'Praga, Varsovia, Budapest, Estocolmo, Oslo, Copenhague, Helsinki, Berna',
    100: 'Liubliana|Ljubljana, Vaduz, La Valeta|Valeta|Valletta, Chisináu|Chisinau, Skopie|Skopje, Tirana, Podgorica, Reikiavik|Reykjavik, Andorra la Vieja',
  }),
  q('sistema-solar', 'Ciencia', 'Nombrá un planeta o una luna del sistema solar', {
    10: 'Tierra, Marte, Júpiter, Saturno, Luna',
    30: 'Venus, Mercurio, Urano, Neptuno',
    60: 'Plutón, Titán, Europa, Ío|Io, Ganímedes, Fobos',
    100: 'Calisto, Encélado, Tritón, Deimos, Miranda, Oberón, Titania, Caronte',
  }),
  q('elementos', 'Ciencia', 'Nombrá un elemento de la tabla periódica', {
    10: 'Oxígeno, Hidrógeno, Carbono, Hierro, Oro',
    30: 'Plata, Cobre, Helio, Nitrógeno, Sodio, Calcio',
    60: 'Litio, Neón, Potasio, Zinc|Cinc, Mercurio, Plomo, Uranio, Aluminio, Cloro, Flúor, Azufre, Fósforo, Silicio, Magnesio',
    100: 'Tecnecio, Itrio, Rutenio, Praseodimio, Disprosio, Holmio, Lutecio, Hafnio, Osmio, Galio, Germanio, Vanadio, Escandio, Telurio, Bismuto, Cerio',
  }),
  q('instrumentos', 'Música', 'Nombrá un instrumento musical', {
    10: 'Guitarra, Piano, Batería, Violín',
    30: 'Bajo, Flauta, Saxofón|Saxo, Trompeta, Bandoneón, Charango',
    60: 'Violonchelo|Chelo|Cello, Clarinete, Oboe, Arpa, Ukelele, Acordeón, Trombón, Contrabajo, Bombo',
    100: 'Fagot, Theremín|Theremin, Sitar, Didgeridoo, Marimba, Celesta, Clavecín, Zampoña, Kalimba, Gaita, Erhu',
  }),
  q('animales-p', 'Naturaleza', 'Nombrá un animal que empiece con P', {
    10: 'Perro, Pato, Pez, Pájaro',
    30: 'Pingüino, Panda, Puma, Pollo, Paloma, Pulpo',
    60: 'Pelícano, Puercoespín, Pantera, Pavo, Pavo real, Perezoso, Piraña, Pulga',
    100: 'Pangolín, Pudú, Pecarí, Petrel, Pichiciego, Piquero',
  }),
  q('subte-baires', 'Subte', 'Nombrá una estación del subte de Buenos Aires', {
    10: 'Plaza de Mayo, Catedral, Retiro, Constitución, Congreso, Callao, Palermo, Plaza Italia, Florida, Pueyrredón, 9 de Julio|Nueve de Julio, Once',
    30: 'Perú, Lima, Avenida de Mayo, Carlos Pellegrini, Diagonal Norte, Tribunales, Facultad de Medicina, Uruguay, Pasteur, Medrano, Scalabrini Ortiz, Plaza Miserere, Primera Junta, Federico Lacroze|Lacroze, Juramento, Bolívar, Correo Central, Santa Fe, Corrientes, Lavalle, General San Martín|San Martín, Leandro N. Alem|Alem, Independencia, Moreno, San Juan, Belgrano',
    60: 'Piedras, Sáenz Peña, Pasco, Alberti, Loria, Castro Barros, Río de Janeiro, Acoyte, Carlos Gardel|Gardel, Ángel Gallardo, Malabia, Dorrego, Agüero, Bulnes, Ministro Carranza, Olleros, José Hernández, Congreso de Tucumán, Catalinas, San José, Entre Ríos, Pichincha, Jujuy, Urquiza, Boedo, Las Heras, Córdoba, Venezuela, Humberto I|Humberto Primo, Caseros, Parque Patricios, Facultad de Derecho, Tronador, Los Incas, Puán, Carabobo',
    100: 'San José de Flores, San Pedrito, Echeverría, Juan Manuel de Rosas, Avenida La Plata, José María Moreno, Emilio Mitre, Medalla Milagrosa, Varela, Plaza de los Virreyes, Inclán, Hospitales',
  }),
  q('pizza', 'Comida', 'Nombrá un ingrediente de pizza', {
    10: 'Muzzarella|Mozzarella|Muzarela|Queso, Tomate, Jamón',
    30: 'Aceitunas|Aceituna, Morrón, Cebolla, Orégano, Pepperoni',
    60: 'Champiñones|Champiñón|Hongos, Anchoas, Rúcula, Albahaca, Huevo, Palmitos, Ananá|Piña',
    100: 'Alcaparras, Provolone, Jamón crudo, Alcauciles, Berenjena, Gorgonzola',
  }),
  q('deportes-olimpicos', 'Deportes', 'Nombrá un deporte olímpico', {
    10: 'Fútbol, Natación, Atletismo, Básquet|Baloncesto',
    30: 'Tenis, Vóley|Voleibol, Hockey, Rugby, Boxeo, Ciclismo, Judo',
    60: 'Esgrima, Remo, Handball|Balonmano, Gimnasia, Golf, Taekwondo, Surf, Skate, Tiro con arco',
    100: 'Pentatlón moderno|Pentatlón, Bádminton, Piragüismo|Canotaje, Lucha, Halterofilia|Levantamiento de pesas, Waterpolo, Breaking, Escalada, Vela, Triatlón',
  }),
  q('provincias-ar', 'Argentina', 'Nombrá una provincia argentina', {
    10: 'Buenos Aires, Córdoba, Santa Fe, Mendoza',
    30: 'Tucumán, Salta, Neuquén, Misiones, Entre Ríos, Chubut',
    60: 'Jujuy, San Juan, San Luis, Río Negro, Corrientes, Santa Cruz, Tierra del Fuego, Chaco',
    100: 'La Pampa, Catamarca, Formosa, Santiago del Estero, La Rioja',
  }),
  q('colores', 'Arte', 'Nombrá un color', {
    10: 'Rojo, Azul, Verde, Amarillo, Negro, Blanco',
    30: 'Violeta, Naranja, Rosa, Gris, Marrón, Celeste',
    60: 'Turquesa, Fucsia, Beige, Bordó, Lila, Dorado, Plateado, Magenta, Cian',
    100: 'Ocre, Cerúleo, Bermellón, Carmesí, Índigo, Añil, Malva, Sepia, Siena, Ámbar, Granate, Coral, Lavanda',
  }),
  q('idiomas', 'Idiomas', 'Nombrá un idioma oficial de algún país', {
    10: 'Español|Castellano, Inglés, Portugués, Francés',
    30: 'Alemán, Italiano, Chino|Mandarín, Japonés, Ruso, Árabe',
    60: 'Guaraní, Quechua, Hindi, Coreano, Griego, Turco, Neerlandés|Holandés, Sueco, Polaco',
    100: 'Suajili|Swahili, Tagalo|Filipino, Amhárico, Islandés, Maltés, Tetun, Aimara, Tigriña, Malgache, Kirguís, Somalí',
  }),
];
