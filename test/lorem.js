function* r(start, end) {
    for (var i = start; i < end; i++) {
        yield i;
    }
}

function range(start, end) {
    return Array.from(r(start, end));
}

function isConsonant(c) {
    return ((c.charCodeAt() ^ (~68174912 >> c.charCodeAt())) & 32) === 0;
}
function isVowel(c) {
    return !isConsonant(c);
}

const letters = String.fromCharCode(...range(97, 123)).split("");
const vowels = letters.filter(isVowel);
const consontants = letters.filter(isConsonant);
function word(l = undefined) {
    const exp = Math.round(Math.random());
    if (l == null) {
        l = 2 + Math.round(Math.random() * 8);
    }
    return range(0, l)
        .map(() => Math.round(Math.random() * letters.length))
        .map((x, i) =>
            i % 2 === exp
                ? vowels[x % vowels.length]
                : consontants[x % consontants.length],
        )
        .join("");
}
module.exports.word = word;
function words(n) {
    return range(0, n)
        .map(() => word())
        .join(" ");
}
module.exports.words = words;
