import type { BlueprintModule } from './types';

/**
 * SQL Blueprint — Structured Query Language
 */
export const sqlBlueprint: BlueprintModule[] = [
  {
    id: 'sql-select',
    title: 'SELECT & Filtering',
    concepts: [
      'SELECT, FROM, WHERE',
      'Comparison & logical operators',
      'BETWEEN, IN, LIKE, IS NULL',
      'ORDER BY, LIMIT, OFFSET',
      'DISTINCT',
    ],
    practice: [
      'Find all employees earning above 50k',
      'Retrieve top 5 products by sales',
      'Filter records with NULL values',
    ],
    estimatedHours: 5,
    milestone: 'SELECT Mastered',
  },
  {
    id: 'sql-aggregation',
    title: 'Aggregation & Grouping',
    concepts: [
      'COUNT, SUM, AVG, MIN, MAX',
      'GROUP BY',
      'HAVING',
      'Filtering vs aggregating',
    ],
    practice: [
      'Count employees per department',
      'Find departments with avg salary > 60k',
      'Highest sale per category',
    ],
    estimatedHours: 5,
    milestone: 'Aggregation Completed',
    prerequisites: ['sql-select'],
  },
  {
    id: 'sql-joins',
    title: 'Joins',
    concepts: [
      'INNER JOIN',
      'LEFT / RIGHT OUTER JOIN',
      'FULL OUTER JOIN',
      'SELF JOIN',
      'CROSS JOIN',
      'Join on multiple conditions',
    ],
    practice: [
      'Employees with their department names',
      'Customers who have no orders (LEFT JOIN)',
      'Manager-subordinate pairs (SELF JOIN)',
    ],
    estimatedHours: 8,
    milestone: 'Joins Completed',
    prerequisites: ['sql-aggregation'],
  },
  {
    id: 'sql-normalization',
    title: 'Normalization & Schema Design',
    concepts: [
      '1NF, 2NF, 3NF',
      'BCNF',
      'Primary key & foreign key',
      'Composite keys',
      'ER diagram basics',
    ],
    practice: [
      'Normalize a student-courses flat table to 3NF',
      'Design schema for an e-commerce app',
    ],
    estimatedHours: 6,
    milestone: 'Normalization Completed',
    prerequisites: ['sql-joins'],
  },
  {
    id: 'sql-indexes',
    title: 'Indexes & Query Optimization',
    concepts: [
      'What is an index',
      'B-tree index internals',
      'Clustered vs non-clustered',
      'EXPLAIN / EXPLAIN ANALYZE',
      'When NOT to index',
    ],
    practice: [
      'Add index to a large user table and measure query time',
      'Analyze slow query with EXPLAIN',
    ],
    estimatedHours: 6,
    milestone: 'Indexing Completed',
    prerequisites: ['sql-normalization'],
  },
  {
    id: 'sql-window',
    title: 'Window Functions',
    concepts: [
      'OVER clause',
      'ROW_NUMBER, RANK, DENSE_RANK',
      'PARTITION BY',
      'LAG & LEAD',
      'Running totals with SUM OVER',
    ],
    practice: [
      'Rank employees by salary per department',
      'Calculate month-over-month revenue change',
      'Find the second highest salary in each department',
    ],
    estimatedHours: 7,
    milestone: 'Window Functions Completed',
    prerequisites: ['sql-indexes'],
  },
  {
    id: 'sql-cte',
    title: 'CTEs & Subqueries',
    concepts: [
      'Common Table Expressions (WITH)',
      'Recursive CTEs',
      'Correlated subqueries',
      'EXISTS & NOT EXISTS',
      'Subquery vs JOIN performance',
    ],
    practice: [
      'Find employees with salary above company average (CTE)',
      'Recursive CTE to traverse org hierarchy',
      'Replace nested subquery with CTE',
    ],
    estimatedHours: 6,
    milestone: 'CTEs Completed',
    prerequisites: ['sql-window'],
  },
];
