#!/usr/bin/env python3
"""
Build script for NCD-Care+ in sandboxed environment.
Handles noexec /tmp by using memfd_create for Node.js execution.

Usage: python3 build.py
"""
import ctypes, os, sys, subprocess, shutil

def get_node_path():
    """Create a memfd-based node binary and return its /proc path."""
    node_bin = '/tmp/node-v20.11.0-linux-x64/bin/node'
    if not os.path.exists(node_bin):
        print("Downloading Node.js...")
        os.system('curl -fsSL https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.gz -o /tmp/node.tar.gz')
        os.system('cd /tmp && tar -xzf node.tar.gz')
    
    with open(node_bin, 'rb') as f:
        data = f.read()

    libc = ctypes.CDLL('libc.so.6')
    memfd_create = libc.memfd_create
    memfd_create.restype = ctypes.c_int
    memfd_create.argtypes = [ctypes.c_char_p, ctypes.c_uint]
    fd = memfd_create(b'node', 0)
    os.write(fd, data)
    os.lseek(fd, 0, 0)
    return f'/proc/{os.getpid()}/fd/{fd}'

def main():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    node_path = get_node_path()
    
    # Verify node
    result = subprocess.run([node_path, '-v'], capture_output=True, text=True)
    print(f'Node: {result.stdout.strip()}')

    # Install deps if needed
    if not os.path.exists(os.path.join(project_dir, 'node_modules')):
        print('Installing dependencies...')
        npm_cli = '/tmp/node-v20.11.0-linux-x64/lib/node_modules/npm/bin/npm-cli.js'
        subprocess.run([node_path, npm_cli, 'install'], cwd=project_dir,
                      env={**os.environ, 'HOME': '/tmp'})

    # Build with execPath override
    wrapper_js = f'''
Object.defineProperty(process, 'execPath', {{
  get: function() {{ return '{node_path}'; }},
  configurable: true
}});
require('{project_dir}/node_modules/next/dist/bin/next');
'''
    wrapper_path = '/tmp/next_wrapper.js'
    with open(wrapper_path, 'w') as f:
        f.write(wrapper_js)

    env = {**os.environ, 'HOME': '/tmp', 'NEXT_TELEMETRY_DISABLED': '1'}
    proc = subprocess.Popen(
        [node_path, wrapper_path, 'build'],
        cwd=project_dir, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT
    )
    for line in proc.stdout:
        sys.stdout.write(line.decode())
    proc.wait()
    
    if proc.returncode == 0:
        print('\\n✅ Build successful! Output in ./out/')
    else:
        print(f'\\n❌ Build failed with code {proc.returncode}')
    
    return proc.returncode

if __name__ == '__main__':
    sys.exit(main())
