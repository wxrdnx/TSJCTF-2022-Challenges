using System;
using System.Diagnostics;

namespace Test // Note: actual namespace depends on the project name.
{
    internal class Program
    {
        static void Main(string[] args)
        {
            Int32 seed = 1022997370;
            Random random = new Random(seed);
            using (BinaryReader reader = new BinaryReader(File.Open("C:\\Users\\user\\Desktop\\result.txt", FileMode.Open)))
            {
                byte[] result = new byte[124814];
                for (int i = 0; i < 124814; i++)
                {
                    result[i] = (byte)random.Next(0, 0x100); 
                    result[i] ^= reader.ReadByte();
                }
                using (BinaryWriter writer = new BinaryWriter(File.Open("C:\\Users\\user\\Desktop\\hahaha.docm", FileMode.Create)))
                {
                    writer.Write(result);
                }
            }
        }
    }
}