# Rabbit and the Moon

* Category: Reverse
* Solves: 1/428

## Description
Hey Moona!

## Hint

```
Which stream cipher is related to "rabbit"?
Which programming language is related to "moon"?
```

## Solution

This challenge is the most difficult reverse challenge in this CTF. First, use `file` command and see what the binary is

```bash
$ file chall
chall: ELF 64-bit LSB pie executable, ARM aarch64, version 1 (SYSV), dynamically linked, BuildID[sha1]=9d4ca2e5837e7cd40e3e6979b2d0f546758a410b, for GNU/Linux 3.7.0, stripped
```

It's a 64-bit ARM executable. Thus, if you want to debug this binary, you muse use `qemu-aarch64`.

Furthermore, it is stripped, which means that reversing this challenge will be pain peko.

Anyway, let's run the binary experimentally (using qemu) first.

### Run it!

![](https://i.imgur.com/WuUadCc.png)

Here, we may notice that initially, the binary requires you to enter a URL. Then, if the URL somehow does not exist, it will throw an error message and exit instantly.

After several minutes of experimentation, you may notice that even if you enter a valid URL, it still spits the message `Alert!: HTTP/1.1 404 Not Found`. Conspicuously, it is nearly impossible to move on. So for now, let's statically analyze this binary using the `strings` command.

### Static analysis (`strings`)

To begin with, let's take a look at the result of `strings` command. First, we may find 4 interesting strings in the result:

![](https://i.imgur.com/eQlyMuk.png)


First, it appears that these strings are some sort of MAC address. However, without a full static analysis of this binary, we cannot be certain.


Afterward, if we roll down several lines, we may again find several funny-looking strings:

![](https://i.imgur.com/Hi8ymY0.png)

First of all, `https://usada-kensetsu.pe.ko`  is a URL. Furthermore, two messages seem to follow the URL. One is a message that comes across as success information, and the other turns out to be an error message. Therefore, it is readily apparent that the binary wants us to enter this URL.

![](https://i.imgur.com/epTFOhS.png)

Yey! It shows the correct message. However, it requires us to enter the password. Let's enter some random gibberish:

![](https://i.imgur.com/2OKHJRw.png)

Expectedly, inputting random stuff won't pass the password checking functionality.

It will be futile if we blindly guess the password since this challenge does not appear to be an easy one. That is to say, it's more advisable to investigate some more readable strings in the binary.

Let's move on. The `$LuaVersion` string blatantly tells us that the binary is running Lua, and the version is 5.4.2. This will be quite helpful for us in the near future.

Anyhow, after scrolling down a little bit, we may discover even more strings that shows that the binary contains functions that pertain to Lua:

![](https://i.imgur.com/0knRiZU.png)

Nevertheless, several strings after those Lua-related strings are quite boring, because they might be strings that come from libc. So from now on, we can continue and move on to real static analysis.

### Static Analysis (`ghidra`)

The first thing you'll notice is that since this binary is stripped, it is impossible to stop our main function.
Luckily, we may use "cross-reference" to locate our main function.
When the binary is executed, the string `URL to open: ` is printed, so we may cross-reference this string and found the main function:

![](https://i.imgur.com/hiGegGG.png)

(Goto 0x1e9758 & Press Ctrl-Shift-F on `DAT_001e9758`)

![](https://i.imgur.com/pNvs99r.png)

(Press Ctrl-Shift-F on `FUN_0010cab4`)

![](https://i.imgur.com/XPG2Tnh.png)

There you go, you found the main function!

Now, let's briefly analyze `main`:

### `main`

```c

undefined8 FUN_0010cf08_main(void)

{
  FUN_0014a5e0(5,FUN_0010ccdc);
  FUN_0010cab4();
  FUN_0010cefc();
  FUN_0010cc84();
  return 0;
}

```

First, the main function calls `FUN_0014a5e0` with two parameters `5` and seemingly a function pointer `FUN_0010ccdc`. First, you may notice that upon these 5 functions in `main`, only the first one starts with `FUN_0014`. The other four functions start with `FUN_0010c`. What does this mean? Well, `FUN_0010ccdc`, `FUN_0010cab4`, `FUN_0010cefc`, and `FUN_0010cc84` all resided near the main function, right? But `FUN_0014a5e0` is far away from the main. This indicates that `FUN_0014a5e0` might be a library function.

But which function is `FUN_0014a5e0`? There are several ways to identify it. For me, I use `strace` to figure this out:

```bash
$ strace qemu-aarch64 ./chall
# Result:
# ...
# rt_sigprocmask(SIG_SETMASK, ~[RTMIN RT_1], NULL, 8) = 0
# rt_sigaction(SIGTRAP, {sa_handler=0x5c7b60, sa_mask=~[RTMINRT_1], sa_flags=SA_RESTORER|SA_RESTART|SA_SIGINFO, ...
# rt_sigprocmask(SIG_SETMASK, ~[RTMIN RT_1], NULL, 8) = 0
# fstat(1, {st_mode=S_IFCHR|0620, st_rdev=makedev(0x88, 0x2), ...}) = 0
# fstat(0, {st_mode=S_IFCHR|0620, st_rdev=makedev(0x88, 0x2), ...}) = 0
# write(1, "\33[1;33mURL to open: \33[0m", 24URL to open: ) = 24

```
Notice the `rt_sigprocmask` and `rt_sigaction` functions before `write`? The result suggests that maybe `FUN_0014a5e0` has something to do with signals. Moreover, you may notice that the first parameter of `rt_sigaction` is `SIGTRAP`. This is extremely unusual because `SIGTRAP` is a signal used for debuggers. In fact, this is a quite common anti-debugging mechanism in Linux. If the signal handler of `SIGTRAP` is registered, then the program behaves differently depending on whether a debugger is attached to it or not. I won't go into details, but more information can be found [here](https://github.com/RobertLarsen/ProsaWorkshop/blob/master/presentations/01-reversing/papers/linux-anti-debugging.txt#L131)

In addition, `kill -l SIGTRAP` indicates that the signal number of `SIGTRAP` is 5. Sounds familiar, right?

So all in all, we can boldly speculate that `FUN_0014a5e0` handles signal registration. More precisely, `FUN_0014a5e0` might simply be the `signal` function (since the function signature matches exactly).

#### `FUN_0010cab4`

```c

void FUN_0010cab4(void)

{
  int iVar1;
  undefined auStack136 [128];
  long local_8;
  
  local_8 = DAT_00249e78;
  FUN_0014f760(&DAT_001e9758,0);
  FUN_001500e0("%127s",auStack136);
  FUN_00178840(2);
  iVar1 = FUN_0016d000("https://usada-kensetsu.pe.ko",auStack136);
  if (iVar1 != 0) {
    FUN_0015da80(&DAT_001e97d0);
                    /* WARNING: Subroutine does not return */
    FUN_0014b370(1);
  }
  FUN_0015da80(&DAT_001e97a0);
  FUN_0010c764();
  if (local_8 - DAT_00249e78 != 0) {
                    /* WARNING: Subroutine does not return */
    FUN_0017c760(&DAT_00249e78,local_8 - DAT_00249e78,0);
  }
  return;
}

```

This function seems like the one that tells you to enter the URL. It's not important, so I'll skip it. Let's rename it to `get_url` and move on.

#### `FUN_0010cefc`

```c
void FUN_0010cefc(void)

{
  code *UNRECOVERED_JUMPTABLE;
  
                    /* WARNING: Could not recover jumptable at 0x0010cefc. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  UNRECOVERED_JUMPTABLE = (code *)SoftwareBreakpoint(0,0x10cf00);
  (*UNRECOVERED_JUMPTABLE)();
  return;
}
```

This one is really uncanny. We see that `FUN_0010cefc` calls `SoftwareBreakpoint`. `SoftwareBreakpoint` suggests that `FUN_0010cefc` intentionally pause the program and enter debugging process. We know that `SIGTRAP` is registered with a signal handler at `FUN_0010ccdc`. So from now on, the process will enter `FUN_0010ccdc`. I'll just name `FUN_0010cefc` as `trampoline`, and `FUN_0010ccdc` as `real_main`.

Obviously, our next goal is to analyze `real_main`

#### `real_main`

This section of the code is the hardest to analyze. From the hint, we may know that this function execute Lua. However, it is nearly impossible to tell which lua function is called becuase the binary is stripped.

The trick here is that there must be some hidden lua command (string) concealed in the binary. If we were able to locate the lua commands, we can understand the function better. However, we may notice that the `strings` command clearly has shown us that there were no strings that resemble lua command string. This implies that these commands might have be encoded or encrypted.

Another trick is to skip analyzing library functions and focus on local function. In other words, we can concentrate on functions that nears `main` according to the locality rule. 

In brief, `FUN_0010c794` seems promising, so let's examine it:

#### `FUN_0010c794`

```c

void FUN_0010c794(long param_1,int param_2)

{
  uint uVar1;
  uint uVar2;
  byte local_5;
  uint local_4;
  
  local_5 = 0;
  for (local_4 = 0; (int)local_4 < param_2; local_4 = local_4 + 1) {
    local_5 = *(byte *)(param_1 + (int)local_4) ^ local_5;
    uVar1 = local_4 & 0xf;
    if ((int)local_4 < 1) {
      uVar1 = -(-local_4 & 0xf);
    }
    uVar2 = local_4 & 0xf;
    if ((int)local_4 < 1) {
      uVar2 = -(-local_4 & 0xf);
    }
    *(byte *)(param_1 + (int)local_4) =
         local_5 - "L|54da]{&nsE7`zU"[(int)uVar1] ^ "uS@[>Ak3N$etZ\\_/"[(int)uVar2];
  }
  return;
}
```

This function is quite amusing because it grabs two parameters (`param_1` & `param_2) and do a bunch of decoding-like operations. So we can rename this function to `decode` for the sake of clearity.

Back to `real_main`. We may notice that `param1` is basically `DAT_0024d258`, which refers to some structures in the `.bss` section. `param2` is `(long)*(int *)(&DAT_001e96d0 + (long)i * 4)`. Due to `(int *)`, you may guess that `DAT_001e96d0` is an array of integer. Moreover, `local_4` is a local variable in a for loop, so let's rename it to `i` for convention.

Observer that `some_int_array` is an array of 9 integers. This matches the `i < 9` inside the for loop.

![](https://i.imgur.com/aZQFqNk.png)

After renaming and changing types of some functions and variables, we may get the following pseudo C codes:

```c
...
  for (i = 0; i < 9; i = i + 1) {
    thunk_EXT_FUN_0000c300(&global_buffer,(&PTR_DAT_0024b070)[i],(long)some_int_arra[i]);
    decode(&global_buffer,some_int_arra[i]);
...
```

#### `thunk_EXT_FUN_0000c300`

Above `FUN_0010c794`, there's a strange function called `thunk_EXT_FUN_0000c300`. Notice that `thunk_EXT_FUN_0000c300` consumes three parameters: `global_buffer`, `PTR_DAT_0024b070[i]`, and `some_int_arra[i]`. `PTR_DAT_0024b070` looks like an array of pointer, so let's examine it

![](https://i.imgur.com/kMd8rYi.png)

Note that `PTR_DAT_0024b070` is also an array of 9 elements, and this perfectly tallies with up with the for loop.

Next, let's take a look at some pointers in the array:

![](https://i.imgur.com/qq3xSnj.png)

You can see that it is a character array consists of random-looking bytes. Furthermore, notice that the string length of `DAT_001b29b8` is 0x70, and the string length of `DAT_001b2a30` is 0x38. This indicates that the `some_int_arra[i]` is actually the length of each string! Let's rename `PTR_DAT_0024b070` to `strings` and `some_int_array` to `lengths`.

Back to function `thunk_EXT_FUN_0000c300`. This function's first parameter is a buffer, the second parameter is `strings[i]`, and the third parameter is `lengths[i]`. Undoubtedly, `thunk_EXT_FUN_0000c300` is `memcpy`.

Renaming some variables and functions yields something similar to the below pseudo C code:

```c
  for (i = 0; i < 9; i = i + 1) {
    memcpy(&global_buffer,(&strings)[i],(long)lengths[i]);
    decode(&global_buffer,lengths[i]);
```

Clearly, our next mission is to decode these strings.


### decode strings

We can write a Python program that helps us decode these bytes.
First, grab all 9 of these encoded strings out. Then, emulate the `decode` function. Finally, print the result out.

You may find my script [here](https://github.com/wxrdnx/TSJCTF-2022-Writeups/tree/main/reverse/rabbit_and_the_moon/code/decode.py)

```python
strings = [...]
lengths = [...]
key0 = 'uS@[>Ak3N$etZ\\_/'
key1 = 'L|54da]{&nsE7`zU'
with open('result.lua', 'wb') as f:
    for string in strings:
        result = b''
        tmp = 0
        for i, c in enumerate(string):
            tmp ^= ord(c)
            b = (((tmp - ord(key1[i % 16]) + 256) % 256) ^ ord(key0[i % 16]))
            result += bytes([b])
        result += b'\n\n' # demarcation
        f.write(result)
```

Result (full result [here](https://github.com/wxrdnx/TSJCTF-2022-Writeups/tree/main/reverse/rabbit_and_the_moon/code/result.lua)):

```lua
function l8dNr5HTj2()
    io.write('password:')
    local s = io.read('*l')
    return #s == 64 and s or nil
end

function ulPOQcl9MK()
    print('permission denied')
end

function NFAHPwzl8k()
    print('permission granted')
end

function Ye0OFItZzM()
    return {
        PkAFu = {0, 0, 0, 0, 0, 0, 0, 0},
        Jdtin = {0, 0, 0, 0, 0, 0, 0, 0},
        bLMOG = {0, 0, 0, 0, 0, 0, 0, 0},
        swz7b = {0, 0, 0, 0, 0, 0, 0, 0},
        K3J9X = 0
    }
end
...
```

Indeed, the `decode` function generates a bunch of Lua scripts!

From now on, it is clear that we should analyze the Lua functions.

### Analyze Lua

#### `l8dNr5HTj2`

This function writes `password:` to standard output, read a string `s`, and check whether the length of `s` equals 64. This means that the password is 64 bytes long. Let's rename `l8dNr5HTj2` to `read_passwd`.

#### `ulPOQcl9MK` and `NFAHPwzl8k`

Prints two different strings. It's fair to guess that if the password is correct, `NFAHPwzl8k` will be invoked. Otherwise, `ulPOQcl9MK` will be called instead. Let's rename it to `print_success` and `print_error` respectively.

#### `Ye0OFItZzM` ~ `WqcQnf77B2`

These functions are extremely convoluted and inscrutable. Nevertheless, remember that the hint tells us the binary has something to do with rabbit stream cipher? <del>You can guess that the author of this challenge is lazy and perhaps copy the implementation from somewhere on github</del>. If you search for `Lua cipher` on GitHub, you may find [this](https://github.com/philanc/plc/blob/master/plc/rabbit.lua) implementation. You'll notice that the implementation of these Lua functions is extremely similar. So let's rename them one by one:

```
Ye0OFItZzM -> newstate
NWIeKysI1B -> nextstate
JqFUieXRef -> keysetup
CSqPQhS1p3 -> ivsetup
WqcQnf77B2 -> crypt
```

The only noticeable difference is that the `crypt` function returns `string.format('%04x:%04x:...', XmbF7, XmbF6, ...)`. Remember the four mac addresses that we found via `strings` command? From now on, you can confidently assume that these four mac addresses are related to the encryption/decryption of the rabbit cipher.

#### `lCfN458cIw`

This function prints a long string, XORs `c7Ai3dlP` with `IApFgSuv`, and generates `Hws8YOCX`. Eventually, it prints `"Flag:" .. Hws8YOCX`.

This function is really important because it looks like a flag-generating function.


### Back to `real_main`

We've finished browsing through the lua codes. Let's continue looking for functions close to `main`. 

`FUN_0010c87c` seems like an ideal target. Let's investigate it.

### `FUN_0010c87c`

```c
bool FUN_0010c87c(undefined8 param_1,long param_2)

{
  int iVar1;
  undefined8 uVar2;
  
  FUN_0010eb00(param_1,"l8dNr5HTj2");
  iVar1 = FUN_0010f830(param_1,0,1,0,0,0);
  if (iVar1 == 0) {
    iVar1 = FUN_0010db40(param_1,0xffffffff);
    if (iVar1 != 0) {
      uVar2 = FUN_0010e194(param_1,0xffffffff,0);
      thunk_EXT_FUN_0000c300(param_2,uVar2,0x40);
      *(undefined *)(param_2 + 0x40) = 0;
    }
    return iVar1 != 0;
  }
                    /* WARNING: Subroutine does not return */
  FUN_0014b370(1);
}
```

Notice the `l8dNr5HTj2` string? The function passes `l8dNr5HTj2` to `FUN_0010eb00`, and `l8dNr5HTj2` is essentially `read_passwd`. So it's fine to guess that this function reads the password from your input.

In addition, the `param2` is passed as a stack variable `auStack80`. `param2` is shown in this if statement:

```
if (iVar1 != 0) {
      uVar2 = FUN_0010e194(param_1,0xffffffff,0);
      thunk_EXT_FUN_0000c300(param_2,uVar2,0x40);
      *(undefined *)(param_2 + 0x40) = 0
}
```

the `thunk_EXT_FUN_0000c300` looks familiar, right? Yes, it's memcpy. So basically after some checking, the if statement calls `FUN_0010e194` and returns `uVar2`. After that, it calls `memcpy` to store `uVar2` onto `param_2`. Eventually, it adds a null byte at the end of `param_2`.

It's not clear what `param_2` is after the function ends. So we may need to use dynamic debugging to verify this. 

### Dynamic debugging

But note that we cannot debug the process from the start due to the anti-debugging mechanism. There are multiple ways to do so. For me, I simply patch the binary by changing the address of `trampoline` to `real_main` inside the main function. 

The calculation of the instruction is as follows:

```
0x10cf2c is the address where the main function jumps to 0x0010cefc.

Suppose the offset is x, then we want our function to jump to 0x10ccdc, so
(0x10cf2c + x * 4) = 0x10ccdc
-> x = -148.

and -148 is essentially 0xffff6c in 2's complement form.
```
Therefore, change the opcode at 0xcf2c from 0xf4 to 0x6c:

![](https://i.imgur.com/s5cS0TL.png)
![](https://i.imgur.com/mlwjOq4.png)

I'll name the patched program as [`chall_patched`](https://github.com/wxrdnx/TSJCTF-2022-Writeups/tree/main/reverse/rabbit_and_the_moon/code/chall_patched). 

Anyway, we can debug as usual now. Type `qemu-aarch64 -g 1234 ./chall_patched` on one terminal, `gdb-multiarch` on another one, enter `target remote localhost:1234`, and start debugging!

![](https://i.imgur.com/RIRACVE.png)

We now break at `0x10ce08` and see what `auStack80` contains:

![](https://i.imgur.com/OTYsomn.png)

![](https://i.imgur.com/1XM2lWl.png)

Conspicuously, `auStack80` contains the password that I entered. So let's rename `auStack80` to `my_passwd`.

Next, let's we can inspect `X0` and found out that it equals 1. So it'll presumably enter the else block.

![](https://i.imgur.com/FI25l5I.png)

Moving on. Let's investigate the else block:

```c
    for (local_7c = 0; local_7c < 4; local_7c = local_7c + 1) {
      local_68 = *(undefined8 *)((long)my_passwd + (long)(local_7c << 4));
      uStack96 = *(undefined8 *)((long)my_passwd + (long)(local_7c << 4) + 8);
      local_58 = 0;
      uVar4 = FUN_0010c928(uVar3,&local_68,(&PTR_DAT_0024b010)[local_7c],
                           (&PTR_DAT_0024b030)[local_7c]);
      iVar2 = FUN_0016d000(uVar4,(&PTR_s_1c92:a70b:95d2:f20e:dfab:0ecb:03_0024b050)[local_7c]);
      if (iVar2 != 0) {
        FUN_0010cbc4(uVar3);
        goto LAB_0010ceec;
      }
    }
    FUN_0010cb68(uVar3);
    FUN_00178840(2);
    FUN_0010cc20(uVar3,my_passwd)
```

`local_7c` is the index of for loop, so I'll change it to `j` for clearness.

`local_68` looks like a buffer, and it stores the content of `&my_passwd[j * 16]`. Similarly, `uStack96` seems to store the value inside `&my_passwd[(j * 16) + (8 * 8) / 4]` = `&my_passwd[(j * 16) + 16]` = `&my_passwd[(j + 1) * 16]`.

`local_58` is the pointer after `uStack96`, and it stores `\0`

Based on the facts mentioned above, the program seems to copy `my_passwd[j * 16 : (j + 1) * 16]` to `local_68` and append a null byte to it. So I'll rename `local_68` to `passwd_chunk`.

`PTR_DAT_0024b01` is clearly a global array full of pointers, so are `PTR_DAT_0024b030` and `PTR_s_1c92:a70b:95d2:f20e:dfab:0ecb:03_0024b050`.

![](https://i.imgur.com/XK14zNs.png)
![](https://i.imgur.com/M6JXiyb.png)

It seems that they're all an array of 4 elements, which matches the for loop. Yet, `PTR_s_1c92:a70b:95d2:f20e:dfab:0ecb:03_0024b050` is exceptionally interesting because it contains the suspicious mac addresses related to encryption.

For now, let's take a glimpse at `FUN_0010c928`. Inside the function `FUN_0010c928`, we may spot some familiar strings:

```c
undefined8 FUN_0010c928(undefined8 param_1,undefined8 param_2,undefined8 param_3,undefined8 param_4)

{
  int iVar1;
  undefined8 uVar2;
  
  FUN_0010eb00(param_1,"Ye0OFItZzM");
  iVar1 = FUN_0010f830(param_1,0,1,0,0,0);
  if (iVar1 != 0) {
                    /* WARNING: Subroutine does not return */
    FUN_0014b370(1);
  }
  FUN_0010f174(param_1,"Flk8z1aL");
  FUN_0010eb00(param_1,"JqFUieXRef");
  FUN_0010eb00(param_1,"Flk8z1aL");
  FUN_0010e814(param_1,param_3);
  iVar1 = FUN_0010f830(param_1,2,0,0,0,0);
  if (iVar1 != 0) {
                    /* WARNING: Subroutine does not return */
    FUN_0014b370(1);
  }
  FUN_0010eb00(param_1,"CSqPQhS1p3");
  FUN_0010eb00(param_1,"Flk8z1aL");
  FUN_0010e814(param_1,param_4);
  iVar1 = FUN_0010f830(param_1,2,0,0,0,0);
  if (iVar1 != 0) {
                    /* WARNING: Subroutine does not return */
    FUN_0014b370(1);
  }
  FUN_0010eb00(param_1,"WqcQnf77B2");
  FUN_0010eb00(param_1,"Flk8z1aL");
  FUN_0010e814(param_1,param_2);
  iVar1 = FUN_0010f830(param_1,2,1,0,0,0);
  if (iVar1 != 0) {
                    /* WARNING: Subroutine does not return */
    FUN_0014b370(1);
  }
  uVar2 = FUN_0010e194(param_1,0xffffffff,0);
  return uVar2;
}
```

It calls several functions regarding rabbit cipher. In fact, it calls each of the 5 rabbit cipher Lua functions in order. So we may conclude that this function performs encryption/decryption. Also, when it calls `JqFUieXRef` (`keysetup`), `param_3` is used, and when it calls `CSqPQhS1p3` (`ivsetup`), `param_4` is used. Presumably, `param_3` is the key and `param_4` is the iv. Let's name both of these arrays as `keys` and `ivs`.

#### `FUN_0010cbc4`, `FUN_0010cb68`, and `FUN_0010cc2`

`FUN_0010cbc4` is also a function that is located near `main`. Observe that inside the function, it calls `ulPOQcl9M` (`print_error`). So `FUN_0010cbc4` is the function that prints `permission failed`. Similarly, `FUN_0010cb68` calls `NFAHPwzl8k` (`print_success`), so it is the function that prints `permission granted`.

Last but not least, `FUN_0010cc2` appears to invoke `lCfN458cIw`, so it may be the function that prints the correct flag. I'll rename it to `print_flag`.

Upon gathering all information mentioned above, let us rename numerous variables in the for loop:

```c
for (j = 0; j < 4; j = j + 1) {
  passwd_chunk = *(undefined8 *)((long)my_passwd + (long)(j << 4));
  passwd_chunk_back = *(undefined8 *)((long)my_passwd + (long)(j << 4) + 8);
  last = 0;
  uVar4 = encrypt(uVar3,&passwd_chunk,(&keys)[j],(&ivs)[j]);
  iVar2 = strcmp_probably(uVar4,(&mysterious_mac_addresses)[j]);
  if (iVar2 != 0) {
    print_error(uVar3);
    goto LAB_0010ceec;
  }
}
print_success(uVar3);
sleep(2);
print_flag(uVar3,my_passwd);
```

So the encryption/decryption process works as follows:

1. Split the 64-byte input into 4 substrings (each 16 bytes).
2. Call `encrypt` and obtain the MAC-address-like string.
3. Compare the string. If the encrypted string does not match `mysterios_mac_addresses[j]`, print error.
4. If all 4 strings match, print success messages & flag.

Apparently, our last goal is to decrypt the secret password.

### Obtain the password

We all know that the encryption and decryption of stream ciphers are the same. In addition, the keys and ivs are known. Thus, it is not difficult to write a script that decrypts the mysterious MAC addresses. See [decrypt.lua](https://github.com/wxrdnx/TSJCTF-2022-Writeups/tree/main/reverse/rabbit_and_the_moon/code/decrypt.lua) for the whole script.

```lua
...
function solve ()
    local keys = {
        "\x39\xb6\xe8\x11\xd6\x42\x48\x3b\xa3\x73\x4b\x04\xf4\x6f\x44\x53",
        "\x27\x02\x08\x06\x7f\x5d\xa7\xd5\xff\xf2\x4c\xee\x09\x09\x92\x36",
        "\x26\xcc\x61\x48\x41\x35\x7b\xff\x17\xe2\x43\xff\x28\x0d\xd3\xc8",
        "\x15\xbe\xa9\xdf\x6d\x29\x2d\xd1\x8c\xe3\xf8\x0e\x55\x90\xbe\xbc"
    }

    local ivs = {
        "\x2c\x6a\x89\x01\x12\x4e\x7c\x71",
        "\x12\xa6\x77\x2a\x60\x59\x87\xd0",
        "\x10\xa0\x7b\x91\x8a\xc5\xc4\xab",
        "\x99\x8b\xc2\x61\x8c\xae\x20\x0c"
    }

    local ciphers = {
        "1c92:a70b:95d2:f20e:dfab:0ecb:0315:3299",
        "7a77:0099:8244:3210:8580:72a8:33f8:fc21",
        "29b0:dd05:820a:1d51:85c2:317b:de47:84ed",
        "a944:e8c3:3737:7e68:1997:9d89:03cb:94f9"
    }

    flag = ''
    for i = 1, 4 do
        local cipher = ''
        for num in string.gmatch(ciphers[i], "(%x+)") do
            short = tonumber(num, 16)
            cipher = string.char((short >> 8) & 0xff) .. cipher
            cipher = string.char(short & 0xff) .. cipher
        end
        flag = flag .. decrypt(cipher, keys[i], ivs[i])
    end
    print(flag)
end

solve()
```

Result:

```bash
$ lua decrypt.lua
# 5ZGKZODeX93pV1DNmRTFsQSU60nkHnCZ7xDeFDegqMya4rL9KjBdqW1uUnRcoZ7q
```

Finally, enter the password and get the flag!!!
![](https://i.imgur.com/qoRaqDu.png)

![](https://i.imgur.com/d1IBqgm.png)

## Flag

```
TSJ{Join_Usada_Kensetsu_together_with_Pekora_and_Moona_Ha/Ha\Ha}
```
