# on10n

* Category: Reverse
* Solves: 2/428

## Description
TSJ's PC is contaminated by malware again! Luckily, TSJ's hacker friends figured out that the malware was nothing more than shenanigans. To be more specific, it seems that the executable is wrapped with layers and layers of onion-like junk files. Can you help TSJ figure out what the malware is doing?
NOTE: `on10n.exe` is not a real malware. So don't worry :)

## Hint

```
(.exe (.cs (.docm (.vb (.ps1 (.bin (.pdf (.js))))))))
```

# Solution

**Disclaimer: This challenge is probably the worst in this CTF. It is too lengthy, buggy, and contains lots of guessing. I should've added `CSC` tag to this challenge**

This is a hodgepodge reverse challenge that I made to test different reverse engineering skills. The executable is wrapped with layers of hidden files, and the goal is to extract them one by one.

## Stage 1

First, open the `on10n.exe`, and it will pop up a message box that says `Nope`

![](https://i.imgur.com/HtUm8jJ.png)

It's a GUI application, so the first thing you should do is throw this executable into tools like `dnSpy` or `ILSpy`.

In this case, if you open `on10n.exe` in ILSpy, you'll notice that it is a .net bundled executable.

![](https://i.imgur.com/nvcTVNH.png)

Also, you'll notice that this binary contains lots of dlls. This is because the executable is run on top of the .NET core. Thus, lots of these dlls are of no consequence, your must head to the dll that contains the main logic of this executable.

After some investigation, you'll notice that `on10n.dll` seems promising. Now, inspect the functions inside `on10n.dll`. You'll find out that the `MainWindow_Loaded` function seems extremely interesting:

![](https://i.imgur.com/9h5W45p.png)

According to the function name, We may guess that this function is executed after the main window is loaded.

```csharp=
private void MainWindow_Loaded(object sender, RoutedEventArgs e)
{
	IPAddress[] hostAddresses = Dns.GetHostAddresses(Dns.GetHostName());
	uint seed = 0u;
	bool flag = false;
	IPAddress[] array = hostAddresses;
	foreach (IPAddress iPAddress in array)
	{
		if (iPAddress.AddressFamily != AddressFamily.InterNetwork)
		{
			continue;
		}
		uint num = BitConverter.ToUInt32(iPAddress.GetAddressBytes(), 0);
		uint num2 = num;
		List<uint> list = new List<uint>();
		List<uint> list2 = new List<uint>();
		uint num3 = 2u;
		while (num > 1)
		{
			if (num % num3 == 0)
			{
				uint num4 = 0u;
				while (num % num3 == 0)
				{
					num /= num3;
					num4++;
				}
				list.Add(num3);
				list2.Add(num4);
			}
			num3++;
		}
		if (sameFactor(list, list2))
		{
			seed = num2;
			flag = true;
			break;
		}
	}
	if (flag)
	{
		MessageBox.Show("OK", "on10n", MessageBoxButton.OK);
		Random random = new Random((int)seed);
		byte[] nantouPoliceOfficeBureau = on10n.Properties.Resources.NantouPoliceOfficeBureau;
		byte[] array2 = new byte[124814];
		for (int j = 0; j < 124814; j++)
		{
			array2[j] = (byte)random.Next(0, 256);
			array2[j] ^= nantouPoliceOfficeBureau[j];
		}
	}
	else
	{
		MessageBox.Show("Nope", "on10n", MessageBoxButton.OK);
	}
}
```

The message box that we have seen is fired in this function. The function first checks whether your IP address is a certain value through function `sameFactor`. If this is true, it will create a random stream of bytes and xor them with the `NantouPoliceOfficeBureau` byte array.

Here's the code of `sameFactor`:

```csharp=
private bool sameFactor(List<uint> factors, List<uint> exponents)
{
	uint[] array = new uint[4] { 2u, 5u, 3371u, 30347u };
	uint[] array2 = new uint[4] { 1u, 1u, 1u, 1u };
	if (factors.Count != 4 || exponents.Count != 4)
	{
		return false;
	}
	for (int i = 0; i < 4; i++)
	{
		if (factors[i] != array[i] || exponents[i] != array2[i])
		{
			return false;
		}
	}
	return true;
}

```

Basically, it factorizes your IP address and checks whether it equals `2 * 5 * 3371 * 30347`, which is `1022997370`. Seemingly, we can calculate the IP directly, xor the resource, and obtain the hidden file.

First, extract the [resource](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage1/on10n.Properties.Resources.resources): from ILSpy.

![](https://i.imgur.com/CYLgCxR.png)

Then, execute the following command to generate the [`resx` file](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage1/on10n.resx) from `on10n.Properties.Resources.resources`:

```
ResGen.exe C:\Users\user\Desktop\on10n.Properties.Resources.resources C:\Users\user\Desktop\on10n.resx
```

Finally, extract the base64 string from `on10n.resx`, decode it, and xor it with `NantouPoliceOfficeBureau`. Here's the [C# code](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage1/extract_resource.cs):


## Stage 2

Next, we now contain a `.docm` file. And if we run the file, we'll notice that there are lots of numbers in the document. Furthermore, it pops up a message box after the document is open:

![](https://i.imgur.com/kG1NMk4.png)

Since the file extension is `docm`, there must be some VBA macros hidden in it. Indeed, open the `Macros` in `View` and we can see some obfuscated [VBA code](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage2/obfuscated.vb):

![](https://i.imgur.com/449UQQ8.png)

After some deobfuscation, we could get the following [VBA code](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage2/deobfuscated.vb):

```vb=
Sub AutoOpen()
    Test()
End Sub
Function Test()
    Dim doc As String
    Dim tot As Long

    doc = ActiveDocument.Name
    Dim CheckArray(7) As String
    CheckArray(0) = "3FAC"
    CheckArray(1) = "64BE"
    CheckArray(2) = "F1D6"
    CheckArray(3) = "5F5"
    CheckArray(4) = "A216"
    CheckArray(5) = "443C"
    CheckArray(6) = "C0A8"
    For i = 1 To 7
        Dim s
        s = Mid(doc, 3 * (i - 1) + 1, 3)
        If Check(s) <> CheckArray(i - 1) Then
            MsgBox "Nope"
            Exit Function
        Else
            For j = 1 To (3)
                tot = tot + Asc(Mid(s, j, 1))
            Next j
        End If
    Next i
    MsgBox "OK"
    Dim psc, psp As String
    Dim psa() As String

    psp = ""
    psc = ActiveDocument.Content
    psa = Split(psc, ",")
    For i = 1 To (UBound(psa) - LBound(psa) + 1)
        Dim c As Long
        c = CInt(psa(i - 1)) Xor (tot Mod &H100)
        psp = psp & Chr(c)
        tot = (tot * c + &H3DC) Mod &H10000
    Next i

End Function

Function Check(b)
    Dim value, i, n, t As Integer
    t = &HFFFF
    For n = 1 To Len(b)
        Dim i, m
        m = Asc(Mid(b, n, 1))
        t = t Xor m
        For i = 1 To 8
            If t / 2 <> Int(t / (2) Then
                value = &HA001
            Else
                value = 0
            End If
            t = Int(t / (2)) And &H7FFF
            t = t Xor value
        Next i
    Next n
    result = Hex$(t)
End Function
```

So first it grabs the file name of this document, splits your file name into three characters each, calculates each of the substrings through the `Check` function, and compares them one by one.

So now, we should brute force the check function that generates the file name. Here's the [Python code](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage2/bf.py):

```python=
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
```

Result:

```
oo96iX0tV53Z4uP1.d3cT
```
Nonetheless, we know that this file is a `docm` file, so the last 4 bytes must be `docm`. (In fact, this is due to CRC16 collision. However, the collision does not affect the generation of the hidden file).

Moving on, let's write the output (the `psp` variable) to a file. The [Python script](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage2/generate_powershell.py) helps you generate the PowerShell script.

```python=
doc = 'oo96iX0tV53Z4uP1.docm'
for i in range(7):
    s = doc[3 * i : 3 * (i + 1)]
    tot = 0
    for j in range(3):
        tot += ord(s[j])

psp = ''
psa = [...]
for num in psa:
    c = num ^ (tot % 0x100)
    psp += chr(c)
    tot = (tot * c + 0x3DC) % 0x10000

with open('challenge.ps1', 'w') as f:
    f.write(psp)

```

## Step 3

```powershell
ºöÚmß%çÊúe#Ô SYStem.IO.CoMPrESsion.deFLATeStreAm( [SystEm.IO.MEMoRysTREAM][cOnvErt]::froMBase64STRiNg(...),
[System.IO.cOMprEssION.coMpRessIonmODe]::decOMPresS ) 
|fOReAch-ObJEcT{ neW-oBJECt IO.StReaMReAdeR( $_ , [TeXT.eNCoDING]::ascIi ) } 
| fOreacH-OBjECT { $_.ReaDToenD( )} )| & ( $PshomE[21]+$PSHOme[34]+'X')
```

Well, the `( $PshomE[21]+$PSHOme[34]+'X')` at the end is the same as `iex`, and `iex` is the abbreviated command of `Invoke-Expression`, which is commonly seen in PowerShell malware.

Now, we can guess that the PowerShell will deflate the stream and invoke the command, so our first goal is to deflate the script by writing the following [C# code](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage3/deflate.cs):

```csharp=
using System;
using System.IO;
using System.IO.Compression;

namespace MyApp // Note: actual namespace depends on the project name.
{
    internal class Program
    {
        static void Main(string[] args)
        {
            MemoryStream memoryStream = new MemoryStream(Convert.FromBase64String("..."));
            using (DeflateStream deflateStream = new DeflateStream(memoryStream, CompressionMode.Decompress))
            {
                using (FileStream outputStream = File.Open("C:\\Users\\user\\Desktop\\result.ps1", FileMode.OpenOrCreate))
                {
                    deflateStream.CopyTo(outputStream);
                }
            }
        }
    }
}
```

Result:

![](https://i.imgur.com/gaJGpZ7.png)

Here, we got the [deflated PowerShell script](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage3/deobfuscated.ps1). After beautification, we can obtain the following lines of code:

```powershell=
...
${CurrLocationObject} = Get-Location;
${CurrLocation} = ${CurrLocationObject}.path.ToCharArray();
${DestLocation} = @(0x20,0x17,0x39,0x32,0x50,0x42,0x4f,0x50,0x39,0x51,0x50,0x47,0x40,0x51,0x43,0xf,0xd,0xf,0xf,0x39,0x4c,0x4b,0xe,0xd,0x4b);
${Accum} = 0;
if (${CurrLocation}.Length -ne ${DestLocation}.Length) { 
    echo "Nope";
    exit
}
for (${num} = 0; ${num} -lt ${CurrLocation}.Length; ${num}++) {
    ${char} = ((${CurrLocation}[${num}].ToInt16(${Null}) + 0xdd) -band 0xff);
    if (${char} -ne ${DestLocation}[${num}]) { 
        echo "Nope";
        exit;
    } else {
        ${Accum} = (${Accum} +${char}) -band 0xff;
    }
}
${Shellcode} = [Byte[]] @(...);
echo "OK";
for (${num} = 0; ${num} -lt ${Shellcode}.Length; ${num}++) { 
    ${Shellcode}[${num}] = ${Shellcode}[${num}] -bxor ${Accum}
}
...
```

Looking at the first several lines, the script first obtains the current location, then it checks whether each character in `${CurrLocation}` plus `0xdd` is equal to each character in `${DestLocation}`. If this is the case, then `${Accum}` will add the value of that character to itself modulo 256.

Hence, we should be able to calculate this value directly:

```python=
nums = [0x20,0x17,0x39,0x32,0x50,0x42,0x4f,0x50,0x39,0x51,0x50,0x47,0x40,0x51,0x43,0xf,0xd,0xf,0xf,0x39,0x4c,0x4b,0xe,0xd,0x4b]
accum = 0
for num in nums:
    accum = (accum + num) % 256
print(hex(accum))
# result = 0x38
```
Consequently, we figure out that `${Accum}` equals `0x38`.

Moving on, notice that at line 21 ~ 23, `${Shellcode}` is XORed with this fixed value, so XORing back the shellcode array with `0x38` helps you procure the real shellcode!

Write a [Python script](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage3/generate_shellcode.py) that generates the hidden shellcode.

Result:
```
"\x89\xe5\x64\x8b\x1d\x30\x00\x00\x00\x8b\x5b\x0c\x8b\x5b\x14\x8b\x1b..."
```
## Step 4

Now, we obtain the shellcode. Let's embed this shellcode in a [C file](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage4/shellcode.c), compile it, and analyze it.

```c
#include <stdio.h>
int main() {
    getchar();
    char shellcode[] = "...";
    int (*func)(void) = (int(*)(void))shellcode;
    func();
    return 0;
```

```powershell
gcc sc.c -o sc
```

Now, if we run the executable with Windbg, you'll notice that it is a quite quintessential portable Windows shellcode.

You may refer to [this article](https://idafchev.github.io/exploit/2017/09/26/writing_windows_shellcode.html) for more information. In short, it first try to obtain `GetProcAddress` through PEB -> PEB_LDR_DATA -> InMemoryOrderModuleList -> ...

![](https://i.imgur.com/sjuCy5l.png)

This part is not important, so I'll skip it.

Nevertheless, after the "crawling" is finished, the shellcode keeps on going and try to call the `LoadLibraryA`:

![](https://i.imgur.com/EVl09oc.png)

Then, the shellcode continues and manage to Load `advapi32.dll` via `LoadLibraryA`:

![](https://i.imgur.com/EJFKerZ.png)

After that, it goes on and attempt to grab `GetUserNameA` from `advapi32.dll`:

![](https://i.imgur.com/RJ564JE.png)

Subsequently, it tries to call `GetUserNameA`:

![](https://i.imgur.com/YoorEa1.png)

Continue on, the shellcode seems to check whether the value at `[ebx]` equals to 0x636A7374, `[ebx+4]` equals to 0x30326674, and `[ebx+8]` equals to 0x3232.

![](https://i.imgur.com/6sZcjKI.png)


After turning these numbers into a string, we can conclude that the shellcode is trying to check whether the current username equals `tsjctf2022`.

So obviously, changing the string at `ebx` to `tsjctf2022` will pass the test:

![](https://i.imgur.com/wbhCpZH.png)

![](https://i.imgur.com/hHK6CYE.png)

Finally, the shellcode will do the following instructions repeatedly:

```
xor     ebx, ebx

mov     ecx, ????????
xor     ecx, ebp
xor     ecx, ebx
xor     ebx, ecx
push    ecx

mov     ecx, ????????
xor     ecx, ebp
xor     ecx, ebx
xor     ebx, ecx
push    ecx

mov     ecx, ????????
xor     ecx, ebp
xor     ecx, ebx
xor     ebx, ecx
push    ecx

...
```

This part is particularly promising, because it seems that several interesting values are pushed onto the stack. `ebx` is cleared with 0, but the value of `ebp` is unknown, so we need to grab it from Windbg:

![](https://i.imgur.com/2oS0r2d.png)


Now, if you translate the machine code into pseudocode (Python), it will produce something like the folowing:

```python
ebx = 0
ebp = 0x1a67ad25
nums = [0x1A21E260, 0x3F04E859, 0x0F30DB6B, ...]

val = nums[0] ^ ebp ^ ebx
ebx ^= val
push val

val = nums[1] ^ ebp ^ ebx
ebx ^= val
push val

...
```

Apparently, these lines of code is reversible. Thus, we can write a short [Python script](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage4/generate_pdf.py) that produces these mysterious values.

Result:

```
%PDF-1.3
%箕眇
3 0 obj
<</Type /Page
/Parent 1 0 R
/Resources 2 0 R
/MediaBox [0 0 595.2799999999999727 841.8899999999999864]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 22
/Filter /FlateDecode
>>
...
```

Like the hint says, it produces a pdf file.

## Step 5

The last step is to open the [pdf](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage4/challenge.pdf) directly. If you open the pdf file (with pdf readers that support javascript):

![](https://i.imgur.com/weQjj6M.png)

You'll get a similar message box with data `Nope` on it. From now on, you may suspect that maybe the pdf contains some javascript code in it.

Indeed, if you open the pdf with notepad directly:

![](https://i.imgur.com/mG4IotN.png)

You'll find some [javascript](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage5/obfuscated.js) in it. Clearly, our next goal is to extract the script and analyze it.

After beautifying and deobfuscating the javascript, you may obtain some [more readable code](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage5/deobfuscated.js) similar to the following:

```javascript=
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
```

First, notice that the `d` variable contains an array of ascii like numbers. Line 60 ~ line 63 looks like code that turns the array into a string. After converting `d` to string, it becomes

```
TSJ{???????????????????????????????????????????????????????????????????????????????}
```

What's more, line 64 ~ line 68 appears to calculate some values according to string `f` and store these results in array `h`.

line 69 ~ 73  seems to be the logic that checks whether the flag is correct. Apparently, we should fill in the flag template with correct characters to pass the flag-checking logic. 

So now, understanding the checking functionality is critical. Let's see what function`I` is doing:

```javascript=
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
```

If you're familiar with some levels of cryptography, you'll undoubtedly recognize that this function is doing Extended-Euclidean-Algorithm. Also, the function returns `(y % m + m) % m`, which is essentially `y` in $Z_m$. This implies that the `I(a, m)` function is one that seeks for $a^{-1}$ in $Z_m$. 

Let's move forward and lookinto `L` function:

```javascript=
function L(b) {
    let w = 0;
    for (let i = b.length - 1; i >= 0; i--) {
        w = (w * 256) + b.charCodeAt(i);
    }
    return w;
};
```

This function turns out to be quite intuitive: It turns a string `b` into a numeric value.

Function `J` and `K` are redundant, so there's no point of exploring them.

So now we understand how these functions work. Let's focus on line 67. 

```javascript
h.push(L(f.substring(i * 4, (i + 1) * 4)) * I(i + 1, g[i]));
```
This line of code multiplies two values: `L(f.substring(i * 4, (i + 1) * 4))` and `I(i + 1, g[i])`. `L(f.substring(i * 4, (i + 1) * 4))` means to get the substring of `f` from index `i * 4` to `(i + 1) * 4` and throw this substring into function `L`. So the loop appears to split `f` into chunks of 4 bytes, toss this substring into `L`, and multiply `I(i + 1, g[i])`. `I(i + 1, g[i])` means to look for the multiplicative inverse of `i+1` in $Z_{g[i]}$.

Conspicuously, the multiplication and the multiplicative inverse are both reversible, so looking for the flag directly from the values given is accomplishable.

Let's write some [code](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/on10n/stage5/generate_flag.js) to generate the flag.

Result: `TSJ{javascript_in_pdf_in_shellcode_in_powershell_in_visual_basic_in_executable_f`

Unfortunately, the flag is missing the last section. This is my darn fault because when I was making the challenge, I forgot to change the flag length when altering the flag.

Regardless, we can guess the last four bytes of the flag. The flag format indicates that the last byte is unquestionably '}'. This leaves us to the remaining three bytes.

Well, according to the context, it is hard not to guess that the last two meaningful words is `executable_file`. Thus, adding 'ile}' to the end makes us acquire the final flag!

## Flag

```
TSJ{javascript_in_pdf_in_shellcode_in_powershell_in_visual_basic_in_executable_file}
```
