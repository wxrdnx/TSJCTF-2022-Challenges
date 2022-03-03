# w4nn4cryp7

* Category: Reverse
* Solves: 2/428

## Description
Oh nyo! TSJ's PC has been infected by the w4nn4cryp7 malware! Hopefully, TSJ created a dump file for malware analysts to investigate. Can you help TSJ recover his infected C drive?

***NOTE 1: encoder.exe IS A REAL MALWARE! PLEASE SOLVE THIS CHALLENGE IN A VIRTUAL MACHINE ENVIRONMENT!!!***

Note 2: The flag is ASCII art, and it is hidden in one of the files in TSJ's C drive.

## Solution
### Quick scan 
This is a malware analysis challenge. The malware `encoder.exe` appears to recursively encrypt each file in a specific directory. If you throw the binary into DIE, you'll notice that the binary is packed with UPX:

![](https://i.imgur.com/0hAq1gv.png)

So the first thing to do is unpack the binary:

```bash
upx -d encoder.exe
```
Now, if you throw the executable into disassemblers like IDA or Ghidra, you may discover that it is stripped, so it is extremely hard to analyze the binary.

Nonetheless, if you notice the *file lengths* of these encrypted files, you'll probably realize that the greatest common factor of these file lengths is 16! This means that this malware is probably using block cipher instead of stream cipher or public-key cryptography.

You don't need to delve into the code directly. Instead, let's use some crypto hunting tools to find out the encryption scheme. Personally, I use the [cryfind](https://github.com/oalieno/cryfind.git) to analyze cryptography signatures in the binary.

This is the result:

```
...
[+] Searching For Crypto Constants...
[+] AES [sbox]
    - fullword
        | [0] 637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b275 (big): 0x1dc160
[+] AES [sbox-inv]
    - fullword
        | [0] 52096ad53036a538bf40a39e81f3d7fb7ce339829b2fff87348e4344c4dee9cb547b9432a6c2233dee4c950b42fac34e082ea16628d924b2765ba2496d8bd125 (big): 0x1dc060
...
[+] RC5/RC6 [init]
    - dword
        | [0] 6351e1b7 (big): 0x66508
        | [1] 4786c861 (lnl): 0x66539
[+] RC5/RC6 [Init, -Delta]
    - dword
        | [0] 6351e1b7 (big): 0x66508
        | [1] 4786c861 (big): 0x66539
...
```

Now, we can narrow down the possibilities to three potential candidates: AES, RC5, and RC6. (However, we must be aware that there may be false positives or false negatives, so we still have to use debuggers and disassemblers to understand the in-depth situation.) 

### Static Analysis

Next, Let's analyze the malware statically (using IDA) and dynamically (using Windbg). I'll omit the trial and error parts. In short, the malware roughly does the following things:

1. Check whether the directory satisfies some restrictions
2. Directory traversal and store files in the vector
3. Encryption of all files
4. MessageBoxA.

Clearly, step 4. is not important to us because it's too trivial. For now, we're currently interested in the directory restrictions as well as which cryptography algorithm it is using.

The following shows some decompiled code of step 1.:

![](https://i.imgur.com/znZ4be5.png)

The malware first checks whether the victim is a directory. Then, it requires that the directory resides in your current working directory. Also, the name of that directory must be `victim`. It seems that the security checks are to prevent people from accidentally fxxxing up their computers.

Anyway, after the check, there's a loop there:

![](https://i.imgur.com/UcQfP2Q.png)

This part is of no consequence because it's all about storing files into a vector. We'll skip it currently.

### Dynamic-Analysis

Let's analyze part 3. now. We can create a directory named `victim` and place a file called `a.txt` in it. 

```
PS C:\Users\user\Desktop> tree /f victim
C:\USERS\USER\DESKTOP\VICTIM
    a.txt
```

After all, you need to find the function that generates iv and key to decrypt the file. It's not obvious, but you can spot the function immediately because it'll generate random bytes on some writable areas.

After some trial and error, you may eventually land on a suspicious function at `0x4031f0`:

Before the function starts:
![](https://i.imgur.com/ZoObJNS.png)


After the function ends:

![](https://i.imgur.com/5mdMHPh.png)


Notice how 16 random bytes are written at address `0x86fad0 + 0x8`? If you try it several times, you will find that it produces a different result each time. Therefore, we can highly suspect that this function is a randomly generated function and generates a key or IV.

![](https://i.imgur.com/QanF4ep.png)

What's more, the function is called only twice (one for the key and another for the iv) in the `main` function according to cross-reference:

![](https://i.imgur.com/tod2QC3.png)

From now on, we can boldly guess that `0x4031f0` is the function which generates key and iv. Furthermore, it's fair to speculate that `0x86fad0` is the random number generator object.

### Obtain the key and iv

Yet, how do we obtain the key and iv?

Well, it is quite conspicuous that they're both local variables, so they should be found on the stack. What's more, they are both variables inside the `main` function, so they will not be washed away until the end of the program.

The way to extract the values from the dump file is to first find out the `rbp` when the `main` function executes. After that, we can simply calculate the offset and read the values out.

First, we can get the `rbp` by printing it out directly in Windbg:

![](https://i.imgur.com/NUaUfYc.png)

Next, through IDA, we can see that the offsets of key & iv are `rbp+0x610` and `rbp+0x620` respectively.

![](https://i.imgur.com/UBWZFlp.png)


Unfortunately, the `key_obj` is not the key itself. After some quick investigation, it seems that the object contains a pointer at `rbp+0x638` that points to the key:

![](https://i.imgur.com/ihWAiUY.png)

Now, we know the method to extract the key and iv. Open the dump file using Windbg and extract the real key & iv out:

![](https://i.imgur.com/m9qtcM9.png)


Result:

```
key = { 0x7B, 0xB7, 0x9D, 0x90, 0x14, 0x59, 0x67, 0x1C, 0xAF, 0x46, 0x4F, 0x25, 0x4B, 0x22, 0x95, 0x10 }
iv = { 0x78, 0x51, 0x18, 0xB9, 0xD7, 0xA5, 0x74, 0xA0, 0xAD, 0x8F, 0x7A, 0x1C, 0x7F, 0x8C, 0xB7, 0xE2 }
```

### Determine the encryption scheme

However, how do we know which encryption scheme it is using? Is it AES, RC5, or RC6? Does it use CBC, CFB, OFT, or CTR mode? (ECB is impossible because iv is presented)

It's hard to understand it without deep-diving. However, it is possible to figure it out by some experiments. We can just find some `txt` files in the infected C drive, decrypt it, and check whether the file makes sense or not.

You may check out [test.cpp](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/w4nn4cryp7/code/test.cpp) for more information.

Result:

```
...
Testing RC5 CTR

�r���
      �-V,�'5����9.'}d��.O�����n�|��6nc�
                                            �Ǘ�]�:Χ0�����\|��3�7#߮{��Dr��=H��QPԪFWޡ�5���ݓ�y����^���AN�BX�>`���{����˶%�n5�B�?貨 ��9F���������       ��B�o�{���s�7������b^
��& �a��3�Tع�ԥ�w�ըđ���eZ~ƔB�)>�c~�~��ZY
I����z�69<7ZHHT/B����,)3|@����PH���� H�qT�]],��^QP$Qfq��j������`����x���]!w0


Testing RC6 CBC

 ��F�|�m�\L�P�ños al amor
* Tú conoces las reglas y yo también.
* Un compromiso completo es lo que estoy pensando
* No obtendrías esto de ningún otro tipo.
* Sólo quiero decirte cómo me siento
* Tengo que hacerte entender
# Nunca va a dar
* Nunca te voy a decepcionar
* Nunca voy a correr y abandonarte
* Nunca te haré llorar
* Nunca voy a decir adiós
* Nunca voy a decir una mentira y lastimarte


Testing RC6 CFB

���ۼ�j��a��ڮ��U�>���0u�f�J�Q _
                                D�����z:����P��K
                                                 �J�!��3Q������J՗e���`�D���t�rM�dX�G�f����%w:S찫dE�_��W�|��wt<�:?�}OM���k&���R�2��w)�P�T�a:i��8����
                      �r2L�%R�3g�,ئ/�\8�=�b
                                            ���        ���%�|������qݑ�lA�󣝟�~�(�֯��F+� X���ޚh��~����l�M��p"�RWL��K+<��֜t�1d��0BaI���c̢)Sr^zHb�@�]����Z��5At���EM�q��ȱ����
�}g�������w��}o�!�"��#�
...
```

Clearly, only `RC6` with `CBC` mode produces texts that make sense.

In other words, we have high confidence that the malware is using RC6 CBC mode, so we can finally write a [decryptor](https://github.com/wxrdnx/TSJCTF-2022-Writeups/blob/main/reverse/w4nn4cryp7/code/decryptor.cpp) that decrypts the whole filesystem.

```powershell
PS C:\Users\user\Downloads\w4nn4cryp7\w4nn4cryp7> .\decryptor.exe
"infected_C_drive\\C\\Program Files\\Common Files\\System\\ADO\\msado15.dll" Done.
"infected_C_drive\\C\\Program Files\\Common Files\\System\\OLE DB\\msdaps.dll" Done.
"infected_C_drive\\C\\Program Files\\Common Files\\System\\OLE DB\\oledb32.dll" Done.
"infected_C_drive\\C\\Program Files\\Internet Explorer\\iexplore.exe" Done.
"infected_C_drive\\C\\Program Files\\Windows Media Player\\wmplayer.exe" Done.
"infected_C_drive\\C\\Program Files\\Windows NT\\Accessories\\wordpad.exe" Done.
"infected_C_drive\\C\\Program Files (x86)\\Common Files\\System\\ADO\\msado15.dll" Done.
"infected_C_drive\\C\\Program Files (x86)\\Common Files\\System\\OLE DB\\msdaps.dll" Done.
"infected_C_drive\\C\\Program Files (x86)\\Common Files\\System\\OLE DB\\oledb32.dll" Done.
"infected_C_drive\\C\\Program Files (x86)\\Internet Explorer\\iexplore.exe" Done.
"infected_C_drive\\C\\Program Files (x86)\\Windows Media Player\\wmplayer.exe" Done.
"infected_C_drive\\C\\Program Files (x86)\\Windows NT\\Accessories\\wordpad.exe" Done.
"infected_C_drive\\C\\Users\\Public\\Pictures\\memes\\591208445327.jpg" Done.
"infected_C_drive\\C\\Users\\Public\\Pictures\\memes\\6yzu8tW.png" Done.
"infected_C_drive\\C\\Users\\Public\\Pictures\\memes\\ctfer__calculation.jpg" Done.
"infected_C_drive\\C\\Users\\Public\\Pictures\\memes\\heccer.jpg" Done.
"infected_C_drive\\C\\Users\\Public\\startup.bat" Done.
"infected_C_drive\\C\\Users\\TSJ\\0930final.docx" Done.
"infected_C_drive\\C\\Users\\TSJ\\2022-Fall-Syllabus.pdf" Done.
"infected_C_drive\\C\\Users\\TSJ\\Computer_Security_2021_Final.docx" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\info.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\burpsuite_installation.gif" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\Introduction to Penetration Testing\\CH1 Introduction.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\Introduction to Penetration Testing\\CH2 Basic Python Programming.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\Introduction to Penetration Testing\\CH3 Virtual Machine.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\Introduction to Penetration Testing\\CH4 Metasploit.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\Introduction to Penetration Testing\\CH5 Burpsuite.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\Introduction to Penetration Testing\\CH6 Sqlmap.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Desktop\\teaching\\note1.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Documents\\Compilers Final\\main.c" Done.
"infected_C_drive\\C\\Users\\TSJ\\Documents\\Compilers Final\\Makefile" Done.
"infected_C_drive\\C\\Users\\TSJ\\Documents\\Compilers Final\\README.txt" Done.
"infected_C_drive\\C\\Users\\TSJ\\Downloads\\ChromeSetup.exe" Done.
"infected_C_drive\\C\\Users\\TSJ\\Downloads\\yyyy.webp" Done.
"infected_C_drive\\C\\Users\\TSJ\\Music\\Vicetone & Tony Igy - Astronomia.mp3" Done.
"infected_C_drive\\C\\Users\\TSJ\\Music\\YOASOBI癟??疇簫?癟??癟??Official Music Video.wav"
```

Eventually, you'll find the flag at `.\infected_C_drive\C\Users\TSJ\Desktop\teaching\Introduction to Penetration Testing\CH4 Metasploit.txt`. (After getting Rick-rolled for a while XP)

## Flag

```
TSJ{Purchasing_iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea_DOT_com_wont_stop_me_from_going_brrrrr_LMAO}
```


