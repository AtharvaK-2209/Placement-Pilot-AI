import type { BlueprintModule } from './types';

/**
 * Spring Boot Blueprint — Core Spring to Production-ready APIs
 */
export const springBootBlueprint: BlueprintModule[] = [
  {
    id: 'spring-core',
    title: 'Spring Core',
    concepts: [
      'IoC Container',
      'Dependency Injection (constructor & setter)',
      'Bean lifecycle',
      'Bean scopes (singleton, prototype)',
      'Annotations: @Component, @Service, @Repository, @Controller',
      '@Autowired & @Qualifier',
    ],
    practice: [
      'Create a Spring app with manual bean wiring',
      'Replace XML config with annotation-based config',
    ],
    estimatedHours: 10,
    milestone: 'Spring Core Completed',
    prerequisites: ['oop'],
  },
  {
    id: 'rest-apis',
    title: 'REST APIs',
    concepts: [
      '@RestController & @RequestMapping',
      '@GetMapping, @PostMapping, @PutMapping, @DeleteMapping',
      'Request params & path variables',
      'DTOs & ModelMapper',
      'ResponseEntity & HTTP status codes',
      'Input validation with @Valid',
      'Exception handling with @ControllerAdvice',
    ],
    practice: [
      'Build a User CRUD REST API',
      'Add validation to POST endpoint',
      'Return proper error responses with global exception handler',
    ],
    estimatedHours: 12,
    milestone: 'REST APIs Completed',
    prerequisites: ['spring-core'],
  },
  {
    id: 'jpa-hibernate',
    title: 'JPA & Hibernate',
    concepts: [
      'ORM fundamentals',
      '@Entity, @Table, @Column',
      '@Id, @GeneratedValue',
      'JpaRepository & CrudRepository',
      'JPQL & @Query',
      'Entity relationships: @OneToMany, @ManyToOne, @ManyToMany',
      'Cascade types',
      'Lazy vs eager loading',
    ],
    practice: [
      'Persist & retrieve entities with Spring Data JPA',
      'Map a bidirectional OneToMany relationship',
      'Write custom JPQL queries',
    ],
    estimatedHours: 14,
    milestone: 'JPA & Hibernate Completed',
    prerequisites: ['rest-apis'],
  },
  {
    id: 'security-jwt',
    title: 'Spring Security & JWT',
    concepts: [
      'Spring Security fundamentals',
      'Authentication vs authorization',
      'UserDetailsService',
      'JWT structure (header, payload, signature)',
      'JWT filter chain',
      'Role-based access control',
      'Password encoding with BCrypt',
    ],
    practice: [
      'Secure REST API endpoints with JWT',
      'Implement login endpoint that returns JWT',
      'Role-based route protection',
    ],
    estimatedHours: 14,
    milestone: 'Security & JWT Completed',
    prerequisites: ['jpa-hibernate'],
  },
  {
    id: 'swagger-testing',
    title: 'Swagger & Testing',
    concepts: [
      'OpenAPI / Swagger UI setup',
      'Documenting endpoints with @Operation',
      'Unit testing with JUnit 5',
      'Mocking with Mockito',
      '@WebMvcTest for controller tests',
      '@DataJpaTest for repository tests',
    ],
    practice: [
      'Add Swagger to existing REST API',
      'Write unit tests for service layer',
      'Mock repository in controller test',
    ],
    estimatedHours: 10,
    milestone: 'Swagger & Testing Completed',
    prerequisites: ['security-jwt'],
  },
  {
    id: 'deployment',
    title: 'Deployment',
    concepts: [
      'application.properties vs application.yml',
      'Spring profiles (dev, prod)',
      'Building JAR with Maven/Gradle',
      'Docker basics for Spring Boot',
      'Environment variables & secrets management',
    ],
    practice: [
      'Containerize Spring Boot app with Dockerfile',
      'Run app with docker-compose with MySQL',
    ],
    estimatedHours: 8,
    milestone: 'Deployment Ready',
    prerequisites: ['swagger-testing'],
  },
];
