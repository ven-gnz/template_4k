PYTHON = py
COMPILER = cl
CRINKLER = crinkler


prepare: shader.frag prepare_shader.py
	$(PYTHON) prepare_shader.py 

minify:
	shader_minifier.exe shader.frag -o shader.inl --format c-variables

COMMON_FLAGS = /nologo /GS-
LIBS = kernel32.lib user32.lib gdi32.lib opengl32.lib winmm.lib

SOURCE_FILES = main.cpp
OBJ_FILES = main.obj 

TARGET_FILE_DEBUG = intro_debug.exe
TARGET_FILE_RELEASE = intro.exe

COMPILER_FLAGS_DEBUG = /Od /Zi /MDd /DDEBUG_BUILD
COMPILER_FLAGS_RELEASE = /O1 /Zl /DRELEASE_BUILD

CRINKLER_FLAGS_DEBUG = /ENTRY:entry /SUBSYSTEM:WINDOWS /COMPMODE:INSTANT
CRINKLER_FLAGS_RELEASE = /ENTRY:entry /SUBSYSTEM:WINDOWS /COMPMODE:SLOW /ORDERTRIES:5000 /UNSAFEIMPORT

all: release

clean:
	del /Q main.obj *.pdb *.ilk

debug: prepare clean
	$(COMPILER) $(COMMON_FLAGS) $(COMPILER_FLAGS_DEBUG) /c $(SOURCE_FILES)
	$(CRINKLER) $(OBJ_FILES) $(LIBS) /OUT:$(TARGET_FILE_DEBUG) $(CRINKLER_FLAGS_DEBUG) $(LIBS)

release: minify clean
	$(COMPILER) $(COMMON_FLAGS) $(COMPILER_FLAGS_RELEASE) /c $(SOURCE_FILES)
	$(CRINKLER) $(OBJ_FILES) /OUT:$(TARGET_FILE_RELEASE) $(CRINKLER_FLAGS_RELEASE) $(LIBS)
