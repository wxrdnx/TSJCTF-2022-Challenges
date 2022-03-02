from z3 import *

key = b"aequeosalinocalcalinoceraceoaluminosocupreovitriolic"
result = [127, 148, 212, 242, 247, 175, 152, 186, 158, 215, 133, 179, 251, 221, 207, 183, 230, 94, 3, 175, 216, 179, 195, 183, 190, 162, 189, 81, 170, 152, 209, 164, 196, 160, 98, 97, 87, 145, 88, 157, 248, 197, 175, 136, 180, 186, 233, 175, 223, 169, 185, 217]
sbox = [28, 10, 17, 38, 37, 13, 26, 14, 25, 23, 3, 15, 21, 18, 41, 19, 4, 16, 5, 39, 8, 32, 27, 33, 11, 0, 34, 46, 36, 35, 51, 47, 22, 6, 40, 2, 29, 7, 24, 45, 12, 44, 31, 30, 49, 43, 48, 42, 50, 1, 20, 9]

def addkey(flag, r):
    for i in range(len(flag)):
        flag[i] = (flag[i] + key[(i + r + 11) % 52] + 256) % 256;

def shuffle(flag):
    for i in range(len(flag)):
        tmp = flag[i]
        flag[i] = flag[sbox[i]]
        flag[sbox[i]] = tmp

s = Solver()

flag = []
for i in range(52):
    flag.append(BitVec(f'{chr(i)}', 8))

for i in range(32):
    shuffle(flag)
    addkey(flag, i)

for i in range(52):
    s.add(flag[i] == result[i])

assert s.check() == sat
m = s.model()
result = sorted([(d, chr(m[d].as_long())) for d in m], key = lambda x: str(x[0]))
flag = ''.join(x[1] for x in result)

print(flag)
