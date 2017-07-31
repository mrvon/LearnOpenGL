#version 330 core
in vec2 TexCoords;
out vec4 color;

uniform sampler2D ourTexture;

float near = 1.0;
float far = 100.0;
float LinearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0; // Back to NDC
    return (2.0 * near * far) / (far + near - z * (far - near));
}

void show1() {
    color = vec4(vec3(gl_FragCoord.z), 1.0);
}

void show2() {
    // divide by far to get depth in range [0,1] for visualization purposes.
    float depth = LinearizeDepth(gl_FragCoord.z) / far;
    color = vec4(vec3(depth), 1.0f);
}

void show3() {
    // divide by far to get depth in range [0,1] for visualization purposes.
    float depth = LinearizeDepth(gl_FragCoord.z) / far;
    color = vec4(vec3(depth) + vec3(texture(ourTexture, TexCoords)), 1.0f);
}

void main() {
    // show1();
    // show2();
    show3();
}
