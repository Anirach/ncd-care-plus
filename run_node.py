#!/usr/bin/env python3
"""Run node from noexec /tmp via memfd_create"""
import ctypes, os, sys

with open('/tmp/node-v20.11.0-linux-x64/bin/node', 'rb') as f:
    data = f.read()

libc = ctypes.CDLL('libc.so.6')
memfd_create = libc.memfd_create
memfd_create.restype = ctypes.c_int
memfd_create.argtypes = [ctypes.c_char_p, ctypes.c_uint]
fd = memfd_create(b'node', 0)
os.write(fd, data)
os.lseek(fd, 0, 0)
path = f'/proc/self/fd/{fd}'
args = [path] + sys.argv[1:]
os.execv(path, args)
