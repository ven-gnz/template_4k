def make_inl(shader_path, output_path):
    replacements = {
        'VAR_fragColor': 'fragColor',
        'VAR_iResolution': 'iResolution',
        'VAR_iTime': 'iTime'
    }

    with open(shader_path, 'r') as f:
        lines = f.readlines()

    with open(output_path, 'w') as out:
        out.write('#ifndef SHADER_INL_\n')
        out.write('#define SHADER_INL_\n\n')

        for macro, actual in replacements.items():
            out.write(f'#define {macro} "{actual}"\n')

        out.write('\nconst char *shader_frag = \\\n')

        for line in lines:
            line = line.rstrip().replace('\\', '\\\\').replace('"', '\\"')
            out.write(f'"{line}\\n"\n')

        out.write(';\n\n#endif // SHADER_INL_\n')

if __name__ == "__main__":
    make_inl("shader.frag", "shader.inl")