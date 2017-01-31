cmake_minimum_required (VERSION 2.8)

project(LearnOpenGL)

# Prevent compilation in-source
if( ${CMAKE_BINARY_DIR} STREQUAL ${PROJECT_SOURCE_DIR} )
Message( " " )
Message( FATAL_ERROR "Source and build directories are the same.
Create an empty build directory,
change into it and re-invoke cmake")
endif() 

# adding glew
add_definitions(-DGLEW_STATIC)
option(glew-cmake_BUILD_SHARED "" OFF)
add_subdirectory(external/glew-cmake)
include_directories(external/glew-cmake/include external/glew-cmake/src)

# adding glfw
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "Do not build the GLFW example programs" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "Do not build the GLFW tests programs" FORCE)
set(GLFW_INSTALL OFF CACHE STRING "" FORCE)
add_subdirectory(external/glfw)
include_directories(SYSTEM external/glfw/include)

# adding glm
include_directories(SYSTEM external/glm)

# adding assimp
set(ASSIMP_BUILD_ASSIMP_TOOLS OFF CACHE BOOL "Do not build the tools" FORCE)
set(ASSIMP_BUILD_TESTS OFF CACHE BOOL "Do not build the tests" FORCE)
add_subdirectory(external/assimp)
include_directories(SYSTEM external/assimp/include)

# adding SOIL
add_subdirectory(external/SOIL)
include_directories(SYSTEM external/SOIL/src)

if(WIN32)
	set(LIBS glfw opengl32 libglew_static SOIL_Static assimp)
elseif(UNIX)
  set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -Wall")
  # Linux packages native to CMake
  set(LIBS glfw)
  list(APPEND LIBS libglew_static)
  list(APPEND LIBS SOIL_Static)
  list(APPEND LIBS assimp)
  find_package(OpenGL REQUIRED)
  list(APPEND LIBS ${OPENGL_gl_LIBRARY}) # setting LIBS for the first time
  add_definitions(${OPENGL_DEFINITIONS})
  find_package(X11 REQUIRED)
  list(APPEND LIBS ${X11_Xrandr_LIB} ${X11_Xxf86vm_LIB} ${X11_Xinerama_LIB} ${X11_Xi_LIB} ${X11_Xcursor_LIB})
  find_package(Threads REQUIRED)
  list(APPEND LIBS ${CMAKE_THREAD_LIBS_INIT})
  #find_library(RT_LIB rt)
  #list(APPEND LIBS ${RT_LIB})
  # append non-native packages
else()
  set(LIBS )
endif(WIN32)

# Because we use glfw3 we need to link the application with Cocoa
IF(APPLE)
  INCLUDE_DIRECTORIES(/System/Library/Frameworks)
  FIND_LIBRARY(Cocoa_LIBRARY Cocoa)
  FIND_LIBRARY(OpenGL_LIBRARY OpenGL)
  FIND_LIBRARY(IOKit_LIBRARY IOKit)
  FIND_LIBRARY(CoreVideo_LIBRARY CoreVideo)
  MARK_AS_ADVANCED(Cocoa_LIBRARY OpenGL_LIBRARY)
  SET(APPLE_LIBS ${Cocoa_LIBRARY} ${IOKit_LIBRARY} ${OpenGL_LIBRARY} ${CoreVideo_LIBRARY})
  set(LIBS ${LIBS} ${APPLE_LIBS})
ENDIF(APPLE)


# clang && macosx
if(("${CMAKE_CXX_COMPILER_ID}" STREQUAL "Clang") AND APPLE)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -stdlib=libc++")
endif()
# c++11
if(("${CMAKE_CXX_COMPILER_ID}" STREQUAL "Clang") OR ("${CMAKE_CXX_COMPILER_ID}" STREQUAL "GNU"))
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
endif()
# clang && debug adds address sanitizer
if(("${CMAKE_CXX_COMPILER_ID}" STREQUAL "Clang") AND NOT APPLE)
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -fsanitize=address")
endif()

set(CHAPTERS
    1.getting_started
    2.lighting
    3.model_loading
    4.advanced_opengl
    5.advanced_lighting
    6.pbr
    7.in_practice
)

set(1.getting_started
    1.hello_window
    2.hello_triangle
    3.shaders
    4.textures
    5.transformations
    6.coordinate_systems
    7.camera
)

set(2.lighting
    1.colors
    2.basic_lighting
    3.materials
    4.lighting_maps
    5.light_casters
    6.multiple_lights
)

set(3.model_loading
    1.model_loading
)

set(4.advanced_opengl
    1.depth_testing
    2.stencil_testing
    3.1.blending_discard
    3.2.blending_sort
    5.framebuffers
    6.cubemaps
    8.advanced_glsl
    9.geometry_shader
    10.instancing
    11.anti_aliasing
)

set(5.advanced_lighting
    1.advanced_lighting
    2.gamma_correction
    3.1.shadow_mapping
    3.2.point_shadows
    3.3.csm
    4.normal_mapping
    5.parallax_mapping
    6.hdr
    7.bloom
    8.deferred_shading
    9.ssao
)

set(6.pbr
    1.1.lighting
    1.2.lighting_textured
    # 2.1.1.ibl_irradiance_conversion
    # 2.1.2.ibl_irradiance
    # 2.2.ibl_specular
)

set(7.in_practice
    # 1.debugging
    # 2.text_rendering
)



configure_file(configuration/root_directory.h.in configuration/root_directory.h)
include_directories(${CMAKE_BINARY_DIR}/configuration)

# first create relevant static libraries requried for other projects
add_library(STB_IMAGE "src/stb_image.cpp")
set(LIBS ${LIBS} STB_IMAGE)

foreach(CHAPTER ${CHAPTERS})
    foreach(DEMO ${${CHAPTER}})
        file(GLOB SOURCE
            "src/${CHAPTER}/${DEMO}/*.h"
            "src/${CHAPTER}/${DEMO}/*.cpp"
        )
        add_executable(${DEMO} ${SOURCE})
        target_link_libraries(${DEMO} ${LIBS})
		if(WIN32)
        	set_target_properties(${DEMO} PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/bin/${CHAPTER}")
		elseif(UNIX)
			set_target_properties(${DEMO} PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/bin/${CHAPTER}")
		endif(WIN32)
        # copy shader files to build directory
        file(GLOB SHADERS 
                 "src/${CHAPTER}/${DEMO}/*.vs"
                 "src/${CHAPTER}/${DEMO}/*.frag"
                 "src/${CHAPTER}/${DEMO}/*.gs"
        )
        foreach(SHADER ${SHADERS})
			if(WIN32)
            	# configure_file(${SHADER} "test")
            	add_custom_command(TARGET ${DEMO} PRE_BUILD COMMAND ${CMAKE_COMMAND} -E copy ${SHADER} $<TARGET_FILE_DIR:${DEMO}>)
			elseif(UNIX)
				file(COPY ${SHADER} DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/bin/${CHAPTER})			
			endif(WIN32)

        endforeach(SHADER)
      # if compiling for visual studio, also use configure file for each project (specifically to set up working directory)
      if(MSVC)
          configure_file(${CMAKE_SOURCE_DIR}/configuration/visualstudio.vcxproj.user.in ${CMAKE_CURRENT_BINARY_DIR}/${DEMO}.vcxproj.user @ONLY)
      endif(MSVC)
    endforeach(DEMO)
endforeach(CHAPTER)

include_directories(${CMAKE_SOURCE_DIR}/includes)
