To create data for mongodb (online - localhost)

Online db:
<code>
    yarn createdb
</code>

Local db:
<code>
    yarn createdb_local
</code>

<h3>API</h3>
<h4> Get product lists: </h4>
<code>
http://localhost:3000/v1/api/products?page=2&maxResults=2
</code>
default: page = 1 | maxResult = 16

<h4> Get detail of a product: </h4>
<code>
http://localhost:3000/v1/api/products/*ProductID*
</code>