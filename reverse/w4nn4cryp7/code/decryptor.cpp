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

namespace fs = std::filesystem;

int main() {

    using RC6 = CryptoPP::RC6;

    fs::path full_dir = fs::path("infected_C_drive");
    fs::recursive_directory_iterator beg_rdi(full_dir);
    fs::recursive_directory_iterator end_rdi;

    std::vector<fs::path> target_files;

    for (; beg_rdi != end_rdi; ++beg_rdi) {
        fs::path curr_path(beg_rdi->path());
        fs::path curr_file_path(curr_path.filename());
        if (fs::is_regular_file(curr_path)) {
            target_files.push_back(curr_path);
        }
    }

    CryptoPP::byte rc6_key_raw[] = {0x7B, 0xB7, 0x9D, 0x90, 0x14, 0x59, 0x67, 0x1C, 0xAF, 0x46, 0x4F, 0x25, 0x4B, 0x22, 0x95, 0x10};
    CryptoPP::SecByteBlock rc6_key(rc6_key_raw, sizeof(rc6_key_raw));
    CryptoPP::byte rc6_iv[] = {0x78, 0x51, 0x18, 0xB9, 0xD7, 0xA5, 0x74, 0xA0, 0xAD, 0x8F, 0x7A, 0x1C, 0x7F, 0x8C, 0xB7, 0xE2};

    for (fs::path curr_path : target_files) {

        std::ifstream ifs(curr_path, std::ios::binary);
        std::ostringstream oss;
        oss << ifs.rdbuf();
        std::string cipher = oss.str();
        ifs.close();

        // decrypt file
        std::string plain;
        CryptoPP::CBC_Mode<RC6>::Decryption rc6;
        rc6.SetKeyWithIV(rc6_key, rc6_key.size(), rc6_iv);
        CryptoPP::StringSource(cipher, true, new CryptoPP::StreamTransformationFilter(rc6, new CryptoPP::StringSink(plain)));

        fs::remove(curr_path);
        std::string curr_path_name = curr_path.u8string();
        size_t last_index = curr_path_name.find_last_of(".");
        std::string original_name = curr_path_name.substr(0, last_index);

        // write plain text to file
        fs::path original_path(original_name);
        std::ofstream ofs(original_path, std::ios::out | std::ios::trunc | std::ios::binary);
        ofs << plain;
        ofs.close();

        std::cout << original_path << " Done." << std::endl;
    }

    std::exit(0);
}
