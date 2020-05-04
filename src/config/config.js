module.exports = {
  development: {
    username: 'capstone14',
    password: 'fptdltrh',
    database: 'capstone-schema',
    host: 'returnice-db.ciyere7qfg4n.us-east-2.rds.amazonaws.com',
    dialect: 'mysql',
    define: {
      timestamps: false
    }
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: false
  },
  production: {
    username: 'root',
    password: null,
    database: 'database_production',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: false
  }
}
