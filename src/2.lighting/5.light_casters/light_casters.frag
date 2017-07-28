#version 330 core
struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float     shininess;
};

struct Light {
    vec3 pl_position;      // point light position
    vec3 fl_position;      // flash light position
    vec3 fl_direction;     // flash light direction
    float fl_inner_cutoff; // flash light inner cutoff
    float fl_outer_cutoff; // flash light outer cutoff

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

out vec4 color;

uniform vec3 viewPos;
uniform Material material;
uniform Light light;

void main() {
    // Ambient
    vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords));

    // Diffuse
    vec3 norm = normalize(Normal);
    vec3 pl_lightDir = normalize(light.pl_position - FragPos);
    float diff = max(dot(norm, pl_lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));

    // Specular
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-pl_lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));

    // Spotlight (soft edges)
    vec3 fl_lightDir = normalize(light.fl_position - FragPos);
    float theta = dot(fl_lightDir, normalize(-light.fl_direction));
    float epsilon = light.fl_inner_cutoff - light.fl_outer_cutoff;
    float intensity = clamp((theta - light.fl_outer_cutoff) / epsilon, 0.0, 1.0);
    diffuse *= intensity;
    specular *= intensity;

    // Attenuation
    float distance = length(light.pl_position - FragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;

    color = vec4(ambient + diffuse + specular, 1.0f);
}
