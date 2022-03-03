#include <iostream>
#include <filesystem>
#include <unistd.h>
#include <vector>
#include "cryptlib.h"
#include "secblock.h"
#include "modes.h"
#include "hex.h"
#include "files.h"
#include "osrng.h"
#include "rc6.h"
#include "rc5.h"

int main() {

    using AES = CryptoPP::AES;
    using RC5 = CryptoPP::RC5;
    using RC6 = CryptoPP::RC6;

    std::ifstream ifs("./okeydokey.md.LMFAO", std::ios::binary);
    std::ostringstream oss;
    oss << ifs.rdbuf();
    std::string cipher = oss.str();
    std::string plain;
    ifs.close();

    CryptoPP::byte key_raw[] = {0x7B, 0xB7, 0x9D, 0x90, 0x14, 0x59, 0x67, 0x1C, 0xAF, 0x46, 0x4F, 0x25, 0x4B, 0x22, 0x95, 0x10};
    CryptoPP::SecByteBlock key(key_raw, sizeof(key_raw));
    CryptoPP::byte iv[] = {0x78, 0x51, 0x18, 0xB9, 0xD7, 0xA5, 0x74, 0xA0, 0xAD, 0x8F, 0x7A, 0x1C, 0x7F, 0x8C, 0xB7, 0xE2};

    /* AES CBC */
    try {
        plain = "";
        std::cout << "Testing AES CBC" << std::endl << std::endl;
        CryptoPP::CBC_Mode<AES>::Decryption aes_cbc;
        aes_cbc.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(aes_cbc, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* AES CFB */
    try {
        std::cout << "Testing AES CFB" << std::endl << std::endl;
        plain = "";
        CryptoPP::CFB_Mode<AES>::Decryption aes_cfb;
        aes_cfb.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(aes_cfb, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* AES OFB */
    try {
        std::cout << "Testing AES OFB" << std::endl << std::endl;
        plain = "";
        CryptoPP::OFB_Mode<AES>::Decryption aes_ofb;
        aes_ofb.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(aes_ofb, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* AES CTR */
    try {
        std::cout << "Testing AES CTR" << std::endl << std::endl;
        plain = "";
        CryptoPP::CTR_Mode<AES>::Decryption aes_ctr;
        aes_ctr.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(aes_ctr, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }


    /* RC5 CBC */
    try {
        plain = "";
        std::cout << "Testing RC5 CBC" << std::endl << std::endl;
        CryptoPP::CBC_Mode<RC5>::Decryption rc5_cbc;
        rc5_cbc.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc5_cbc, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* RC5 CFB */
    try {
        std::cout << "Testing RC5 CFB" << std::endl << std::endl;
        plain = "";
        CryptoPP::CFB_Mode<RC5>::Decryption rc5_cfb;
        rc5_cfb.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc5_cfb, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* RC5 OFB */
    try {
        std::cout << "Testing RC5 OFB" << std::endl << std::endl;
        plain = "";
        CryptoPP::OFB_Mode<RC5>::Decryption rc5_ofb;
        rc5_ofb.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc5_ofb, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* RC5 CTR */
    try {
        std::cout << "Testing RC5 CTR" << std::endl << std::endl;
        plain = "";
        CryptoPP::CTR_Mode<RC5>::Decryption rc5_ctr;
        rc5_ctr.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc5_ctr, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }


    /* RC6 CBC */
    try {
        plain = "";
        std::cout << "Testing RC6 CBC" << std::endl << std::endl;
        CryptoPP::CBC_Mode<RC6>::Decryption rc6_cbc;
        rc6_cbc.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc6_cbc, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* RC6 CFB */
    try {
        std::cout << "Testing RC6 CFB" << std::endl << std::endl;
        plain = "";
        CryptoPP::CFB_Mode<RC6>::Decryption rc6_cfb;
        rc6_cfb.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc6_cfb, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* RC6 OFB */
    try {
        std::cout << "Testing RC6 OFB" << std::endl << std::endl;
        plain = "";
        CryptoPP::OFB_Mode<RC6>::Decryption rc6_ofb;
        rc6_ofb.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc6_ofb, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }

    /* RC6 CTR */
    try {
        std::cout << "Testing RC6 CTR" << std::endl << std::endl;
        plain = "";
        CryptoPP::CTR_Mode<RC6>::Decryption rc6_ctr;
        rc6_ctr.SetKeyWithIV(key, key.size(), iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc6_ctr, new CryptoPP::StringSink(plain)));
        std::cout << plain << std::endl;
        std::cout << std::endl << std::endl;
    } catch (CryptoPP::Exception &e) {
        std::cout << e.what() << std::endl;
    }
}
