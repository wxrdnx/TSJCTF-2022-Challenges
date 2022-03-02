#!/bin/bash

musl-gcc exploit.c -g -masm=intel -static -o exploit
