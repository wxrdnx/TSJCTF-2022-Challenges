function I(a, m) {
    a = (a % m + m) % m
    const s = []
    let b = m
    while(b) {
        [a, b] = [b, a % b]
        s.push({a, b})
    }
    let x = 1, y = 0;
    for(let i = s.length - 2; i >= 0; --i) {
        [x, y] = [y,  x - y * Math.floor(s[i].a / s[i].b)]
    }
    return (y % m + m) % m
}

function J(v)
{
    var w  = v.toString();
    var s = '';
    for (var n = 0; n < w.length; n += 2) {
        s += String.fromCharCode(parseInt(w.substr(n, 2), 16));
    }
    return s;
}

function K(s) {
    return s.split('').reverse().join('');
}

function L(b) {
    let w = 0;
    for (let i = b.length - 1; i >= 0; i--) {
        w = (w * 256) + b.charCodeAt(i);
    }
    return w;
};

let e = [
    2068468564, 1144603696600,
    831478994210,  629359373248,
    962184141402, 2206207759242,
    1393400813805,  336381623280,
    1421359083024, 2441743882028,
    2558614409999, 1105978251008,
    1087127517945, 1042393394390,
    1305482878903,  155110533693,
    701269297290,  138410330303,
    1302287084697, 1167918982880
]
let d = [
    84, 83, 74, 123, 63, 63, 63, 63, 63, 63, 63,  63,
    63, 63, 63,  63, 63, 63, 63, 63, 63, 63, 63,  63,
    63, 63, 63,  63, 63, 63, 63, 63, 63, 63, 63,  63,
    63, 63, 63,  63, 63, 63, 63, 63, 63, 63, 63,  63,
    63, 63, 63,  63, 63, 63, 63, 63, 63, 63, 63,  63,
    63, 63, 63,  63, 63, 63, 63, 63, 63, 63, 63,  63,
    63, 63, 63,  63, 63, 63, 63, 63, 63, 63, 63, 125
]

let f = ''; 
for (let i = 0; i < d.length; i++) {
    f += String.fromCharCode(d[i]);
}
let g = [1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511];
let h = []
for (let i = 0; i < 20; i++) {
    h.push(L(f.substring(i * 4, (i + 1) * 4)) * I(i + 1, g[i]));
}
let y = true;
for (let i = 0; i < 19; i++) {
    y = y && e[i] == h[i];
}
app.alert(y ? 'Congratz' : 'Nope');
