const router = require("express").Router();
const { Tag, Product, ProductTag } = require("../../models");

// The `/api/tags` endpoint

router.get("/", (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  Tag.findAll({
    attributes: ["tag_name"],
    include: [
      {
        model: Product,
        ProductTag,
        attributes: [
          "product_id",
          "tag_id",
          "catergory_id",
          "price",
          "stock",
          "product_name",
        ],
      },
    ],
  })
    .then((seedProducts) => res.json(seedProducts))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get("/:id", (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  Tag.findOne({
    where: {
      id: req.params.id,
    },
    attributes: ["tag_name"],
    include: [
      {
        model: Product,

        attributes: ["tag_id", "product_id"],
      },
    ],
  })
    .then((seedProducts) => {
      if (!seedProducts) {
        res.status(404).json({ message: "No Products found with this id" });
        return;
      }
      res.json(seedProducts);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.post("/", (req, res) => {
  // create a new tag
  Tag.create({
    tag_name: req.body.tag_name,
  })
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put("/:id", (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete("/:id", (req, res) => {
  // delete on tag by its `id` value
  ProductTag.findAll({ where: { product_id: req.params.id } });
});
// .then((productTags) => {
//   // get list of current tag_ids
//   const productTagIds = productTags.map(({ tag_id }) => tag_id);
//   // create filtered list of new tag_ids
//   const newProductTags = req.body.tagIds
//     .filter((tag_id) => !productTagIds.includes(tag_id))
//     .map((tag_id) => {
//       return {
//         product_id: req.params.id,
//         tag_id,
//       };
//     });
//   // figure out which ones to remove
//   const productTagsToRemove = productTags
//     .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
//     .map(({ id }) => id);

//   // run both actions
//   return Promise.all([
//     ProductTag.destroy({ where: { id: productTagsToRemove } }),
//     ProductTag.bulkCreate(newProductTags),
//   ]);
// })
// .then((updatedProductTags) => res.json(updatedProductTags))
// .catch((err) => {
//   // console.log(err);
//   res.status(400).json(err);
// });

module.exports = router;
