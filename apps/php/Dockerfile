FROM php:7.4-apache
RUN apt-get update && apt-get install -y --no-install-recommends libcurl4-openssl-dev libonig-dev libpng-dev libpq-dev libzip-dev unzip \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring curl gd zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2.2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/platform
COPY apps/php/composer.json apps/php/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist
COPY apps/php/ ./
RUN mkdir -p storage/files storage/logs && chown -R www-data:www-data storage \
    && sed -i 's#/var/www/html#/var/www/platform/public#g' /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /var/www/platform/public>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/platform.conf \
    && a2enconf platform
EXPOSE 80
