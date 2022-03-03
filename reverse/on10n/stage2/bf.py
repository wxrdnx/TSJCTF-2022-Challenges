hex_strings = ['3fac', '64be', 'f1d6', '5f5', 'a216', '443c', 'c0a8']

def check(b):
    t = 0xffff
    for n in range(len(b)):
        m = ord(b[n])
        t = t ^ m
        for j in range(8):
            if (t % 2 == 1):
                value = 0xa001
            else:
                value = 0
            t = (t // 2) & 0x7fff
            t = t ^ value
    t = t % 0x10000
    return hex(t)[2:].lstrip('0')

possible_chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.'
result = ''

for hex_string in hex_strings:
    found = False
    for c0 in possible_chars:
        for c1 in possible_chars:
            for c2 in possible_chars:
                if (check(c0 + c1 + c2) == hex_string):
                    found = True
                    result = result + c0 + c1 + c2
                    break
            if found:
                break
        if found:
            break

print(result)
