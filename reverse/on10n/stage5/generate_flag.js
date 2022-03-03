function inverse(a, m) {
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

function int2str(number) {
    let res = ''
    for (let i = 0; i < 4; i++) {
        res += String.fromCharCode(number % 256);
        number = Math.floor(number / 256);
    }
    return res;
};

flag = 'TSJ{???????????????????????????????????????????????????????????????????????????????}';

let nums = [
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

let primes = [1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511];
let result = ''
for (let i = 0; i < 20; i++) {
    result += int2str(nums[i] / inverse(i + 1, primes[i]));
}
result += 'ile}'
console.log(result)
