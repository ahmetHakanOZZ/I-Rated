import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../src/config/database.js";
const movies = [
    { title: "The Matrix", year: 1999, colors: ["#071c1c", "#21c58e"], symbol: "◉" },
    { title: "The Shawshank Redemption", year: 1994, colors: ["#172837", "#edb65d"], symbol: "☼" },
    { title: "The Godfather", year: 1972, colors: ["#160f13", "#c99a57"], symbol: "♟" },
    { title: "Pulp Fiction", year: 1994, colors: ["#271315", "#f2c14e"], symbol: "✦" },
    { title: "Fight Club", year: 1999, colors: ["#211111", "#ec583f"], symbol: "✳" },
    { title: "Forrest Gump", year: 1994, colors: ["#243c42", "#e6d4a8"], symbol: "⌁" },
    { title: "Titanic", year: 1997, colors: ["#10253c", "#83c8d5"], symbol: "◇" },
    { title: "Star Wars: A New Hope", year: 1977, colors: ["#171c35", "#e8c469"], symbol: "✦" },
    { title: "The Lord of the Rings: The Return of the King", year: 2003, colors: ["#17332b", "#d4b46f"], symbol: "⌑" },
    { title: "Gladiator", year: 2000, colors: ["#321d18", "#d59455"], symbol: "⚔" },
    { title: "Parasite", year: 2019, colors: ["#182b24", "#b8d28b"], symbol: "▥" },
    { title: "Joker", year: 2019, colors: ["#281a32", "#c77ac4"], symbol: "☻" },
    { title: "Jurassic Park", year: 1993, colors: ["#1d3129", "#d9ae52"], symbol: "◉" },
    { title: "Back to the Future", year: 1985, colors: ["#202347", "#f08355"], symbol: "ϟ" },
    { title: "Spirited Away", year: 2001, colors: ["#19334a", "#eea8a0"], symbol: "✧" },
    { title: "The Dark Knight Rises", year: 2012, colors: ["#151b24", "#9dabb7"], symbol: "▲" },
    { title: "The Silence of the Lambs", year: 1991, colors: ["#342a27", "#c8a77b"], symbol: "❋" },
    { title: "The Grand Budapest Hotel", year: 2014, colors: ["#56344a", "#f0b8a6"], symbol: "▤" },
    { title: "Coco", year: 2017, colors: ["#3a1838", "#f2a444"], symbol: "✺" },
    { title: "Whiplash", year: 2014, colors: ["#241a16", "#d96545"], symbol: "♫" },
];
const outputDirectory = new URL("../../client/public/movie_images/posters/", import.meta.url);
function escapeXml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function posterSvg(title, colors, symbol, index) {
    const safeTitle = escapeXml(title);
    const titleLines = title.match(/.{1,19}(?:\s|$)/g)?.map((line) => line.trim()).filter(Boolean) ?? [title];
    const titleMarkup = titleLines.slice(0, 4).map((line, lineIndex) => `<text x="34" y="${440 + lineIndex * 36}" class="title">${escapeXml(line)}</text>`).join("");
    const angle = (index * 23) % 360;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" role="img" aria-label="${safeTitle} illustrated poster">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="#080b12"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${colors[1]}" stop-opacity=".72"/><stop offset="1" stop-color="${colors[1]}" stop-opacity="0"/></radialGradient>
    <pattern id="grain" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#fff" opacity=".16"/></pattern>
    <style>.title{font:700 27px Georgia,serif;letter-spacing:1.1px;fill:#fff}.meta{font:600 10px Arial,sans-serif;letter-spacing:4px;fill:${colors[1]}}</style>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/><circle cx="205" cy="255" r="205" fill="url(#glow)"/>
  <g transform="translate(200 260) rotate(${angle})" fill="none" stroke="${colors[1]}" stroke-opacity=".65">
    <circle r="108" stroke-width="1.5"/><circle r="78" stroke-width="1"/><circle r="48" stroke-width="2"/>
    <path d="M-150 0H150M0-150V150M-106-106L106 106M106-106L-106 106" stroke-width="1"/>
    <path d="M-130 70Q0-150 130 70T-130 70Z" stroke-width="2"/>
  </g>
  <text x="200" y="286" text-anchor="middle" fill="#fff" fill-opacity=".9" font-family="Georgia,serif" font-size="100">${symbol}</text>
  <path d="M30 386H370" stroke="${colors[1]}" stroke-opacity=".7"/>
  <text x="34" y="418" class="meta">I RATED  ·  CINEMA</text>${titleMarkup}
  <rect width="400" height="600" fill="url(#grain)"/>
  <rect x="10" y="10" width="380" height="580" fill="none" stroke="#fff" stroke-opacity=".22"/>
</svg>`;
}
await mkdir(outputDirectory, { recursive: true });
const connection = await db.getConnection();
await connection.beginTransaction();
try {
    for (const [index, movie] of movies.entries()) {
        const filename = `${movie.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "")}.svg`;
        await writeFile(new URL(filename, outputDirectory), posterSvg(movie.title, movie.colors, movie.symbol, index));
        const imagePath = `/movie_images/posters/${filename}`;
        const [existing] = await connection.execute("SELECT id FROM movies WHERE title = ? LIMIT 1", [movie.title]);
        if (Array.isArray(existing) && existing.length > 0) {
            await connection.execute("UPDATE movies SET release_year = ?, image_path = ? WHERE id = ?", [movie.year, imagePath, existing[0].id]);
        }
        else {
            await connection.execute("INSERT INTO movies (title, release_year, image_path) VALUES (?, ?, ?)", [movie.title, movie.year, imagePath]);
        }
    }
    await connection.execute("UPDATE movies SET image_path = '/movie_images/interstellar.jpg' WHERE title = 'Interstellarr'");
    await connection.execute("UPDATE movies SET image_path = '/movie_images/inception.jpg' WHERE title = 'Inception'");
    await connection.execute("UPDATE movies SET image_path = '/movie_images/batman.jpg' WHERE title = 'The Dark Knight'");
    await connection.commit();
    console.log(`Seeded ${movies.length} movie records and poster assets.`);
}
catch (error) {
    await connection.rollback();
    throw error;
}
finally {
    connection.release();
    await db.end();
}
//# sourceMappingURL=seed-movies.js.map