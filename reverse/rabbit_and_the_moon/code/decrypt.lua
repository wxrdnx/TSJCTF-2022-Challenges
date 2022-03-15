function new_state ()
    return {
        x = {0, 0, 0, 0, 0, 0, 0, 0}, 
        c = {0, 0, 0, 0, 0, 0, 0, 0}, 
        c_ = {0, 0, 0, 0, 0, 0, 0, 0}, 
        g = {0, 0, 0, 0, 0, 0, 0, 0}, 
        ca = 0
    }
end

function next_state (state)
    local function rot_left(int, num)
        return ((int << num) | (int >> (32 - num))) & 0xffffffff
    end
    local function g_func(int)
        return ((int * int) >> 32) ~ ((int * int) & 0xffffffff)
    end
    for i = 1, 8 do
        state.c_[i] = state.c[i]
    end
    state.c[1] = (state.c[1] + 0x4D34D34D + state.ca) & 0xffffffff
    state.c[2] = (state.c[2] + 0xD34D34D3 + (state.c[1] < state.c_[1] and 1 or 0)) & 0xffffffff
    state.c[3] = (state.c[3] + 0x34D34D34 + (state.c[2] < state.c_[2] and 1 or 0)) & 0xffffffff
    state.c[4] = (state.c[4] + 0x4D34D34D + (state.c[3] < state.c_[3] and 1 or 0)) & 0xffffffff
    state.c[5] = (state.c[5] + 0xD34D34D3 + (state.c[4] < state.c_[4] and 1 or 0)) & 0xffffffff
    state.c[6] = (state.c[6] + 0x34D34D34 + (state.c[5] < state.c_[5] and 1 or 0)) & 0xffffffff
    state.c[7] = (state.c[7] + 0x4D34D34D + (state.c[6] < state.c_[6] and 1 or 0)) & 0xffffffff
    state.c[8] = (state.c[8] + 0xD34D34D3 + (state.c[7] < state.c_[7] and 1 or 0)) & 0xffffffff
    state.ca = state.c[8] < state.c_[8] and 1 or 0
    for i = 1, 8 do
        state.g[i] = g_func((state.x[i] + state.c[i]) & 0xffffffff)
    end
    state.x[1] = (state.g[1] + rot_left(state.g[8], 16) + rot_left(state.g[7], 16)) & 0xffffffff
    state.x[2] = (state.g[2] + rot_left(state.g[1], 8) + state.g[8]) & 0xffffffff
    state.x[3] = (state.g[3] + rot_left(state.g[2], 16) + rot_left(state.g[1], 16)) & 0xffffffff
    state.x[4] = (state.g[4] + rot_left(state.g[3], 8) + state.g[2]) & 0xffffffff
    state.x[5] = (state.g[5] + rot_left(state.g[4], 16) + rot_left(state.g[3], 16)) & 0xffffffff
    state.x[6] = (state.g[6] + rot_left(state.g[5], 8) + state.g[4]) & 0xffffffff
    state.x[7] = (state.g[7] + rot_left(state.g[6], 16) + rot_left(state.g[5], 16)) & 0xffffffff
    state.x[8] = (state.g[8] + rot_left(state.g[7], 8) + state.g[6]) & 0xffffffff
end

function prepare_key (state, key)
    assert(#key == 16)
    local function rot_left(int, num)
        return ((int << num) | (int >> (32 - num))) 
    end
    local key1, key2, key3, key4 = string.unpack('<I4I4I4I4', key)
    state.x[1] = key1
    state.x[2] = ((key4 << 16) & 0xffffffff | (key3 >> 16))
    state.x[3] = key2
    state.x[4] = ((key1 << 16) & 0xffffffff | (key4 >> 16))
    state.x[5] = key3
    state.x[6] = ((key2 << 16) & 0xffffffff | (key1 >> 16))
    state.x[7] = key4
    state.x[8] = ((key3 << 16) & 0xffffffff | (key2 >> 16))
    state.c[1] = rot_left(key3, 16)
    state.c[2] = (key1 & 0xffff0000) | (key2 & 0xffff)
    state.c[3] = rot_left(key4, 16)
    state.c[4] = (key2 & 0xffff0000) | (key3 & 0xffff)
    state.c[5] = rot_left(key1, 16)
    state.c[6] = (key3 & 0xffff0000) | (key4 & 0xffff)
    state.c[7] = rot_left(key2, 16)
    state.c[8] = (key4 & 0xffff0000) | (key1 & 0xffff)
    state.ca = 0
    for i = 1, 4 do
        next_state(state)
    end
    for i = 1, 4 do
        state.c[i] = state.c[i] ~ state.x[i + 4]
    end
    for i = 5, 8 do
        state.c[i] = state.c[i] ~ state.x[i - 4]
    end
end

function prepare_iv (state, iv)
    assert(#iv == 8)
    local iv1, iv3 = string.unpack('<I4I4', iv)
    local iv2 = (iv1 >> 16) | (iv3 & 0xffff0000)
    local iv4 = ((iv3 << 16) & 0xffffffff) | (iv1 & 0x0000ffff)
    state.c[1] = state.c[1] ~ iv1
    state.c[2] = state.c[2] ~ iv2
    state.c[3] = state.c[3] ~ iv3
    state.c[4] = state.c[4] ~ iv4
    state.c[5] = state.c[5] ~ iv1
    state.c[6] = state.c[6] ~ iv2
    state.c[7] = state.c[7] ~ iv3
    state.c[8] = state.c[8] ~ iv4
    for i = 1, 4 do
        next_state(state)
    end
end

function crypt_block (state, text)
    local block_len = #text
    if block_len < 16 then
        text = text .. string.rep('\0', 16 - block_len)
    end
    next_state(state)
    local text1, text2, text3, text4 = string.unpack('<I4I4I4I4', text)
    local output1, output2, output3, output4
    output1 = text1 ~ state.x[1] ~ (state.x[6] >> 16) ~ ((state.x[4] << 16) & 0xffffffff)
    output2 = text2 ~ state.x[3] ~ (state.x[8] >> 16) ~ ((state.x[6] << 16) & 0xffffffff)
    output3 = text3 ~ state.x[5] ~ (state.x[2] >> 16) ~ ((state.x[8] << 16) & 0xffffffff)
    output4 = text4 ~ state.x[7] ~ (state.x[4] >> 16) ~ ((state.x[2] << 16) & 0xffffffff)
    local output = string.pack('<I4I4I4I4', output1, output2, output3, output4)
    if block_len < 16 then
        output = output:sub(1, block_len)
    end
    return output
end

function decrypt (text, key, iv)
    local state = new_state()
    prepare_key(state, key)
    prepare_iv(state, iv)
    result = ''
    for i = 1, #text, 16 do
        block = text:sub(i, i + 15)
        result = result .. crypt_block(state, block)
    end
    return result
end

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
