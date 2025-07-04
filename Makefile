COMPILER = cl
LINK = link
CRINKLER = crinkler

COMMON_FLAGS = /nologo /GS-
LIBS = kernel32.lib user32.lib gdi32.lib opengl32.lib winmm.lib

SOURCE_FILES =  entry.cpp intro.cpp gl_loader.cpp
OBJ_FILES = entry.obj intro.obj gl_loader.obj

TARGET_FILE_DEBUG = intro_debug.exe
TARGET_FILE_RELEASE = intro.exe

COMPILER_FLAGS_DEBUG = /Od /Zi /DDEBUG_BUILD
COMPILER_FLAGS_RELEASE = /O1 /Zl /DRELEASE_BUILD

LINK_FLAGS_DEBUG = /SUBSYSTEM:WINDOWS /ENTRY:entry

CRINKLER_FLAGS = /ENTRY:entry /SUBSYSTEM:WINDOWS /COMPMODE:SLOW /ORDERTRIES:5000 /UNSAFEIMPORT

all: release

clean:
	for %%f in (*.exe) do if /I not "%%f"=="crinkler.exe" del "%%f"
	del /Q *.obj *.pdb *.ilk

debug: clean
	$(COMPILER) $(COMMON_FLAGS) $(COMPILER_FLAGS_DEBUG) /c $(SOURCE_FILES)
	$(LINK) $(OBJ_FILES) $(LIBS) /Fe:$(TARGET_FILE_DEBUG) $(LINK_FLAGS_DEBUG)

release: clean
	$(COMPILER) $(COMMON_FLAGS) $(COMPILER_FLAGS_RELEASE) /c $(SOURCE_FILES)
	$(CRINKLER) $(OBJ_FILES) /OUT:$(TARGET_FILE_RELEASE) $(CRINKLER_FLAGS) $(LIBS)
